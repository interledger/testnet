import { AccountService } from '@/account/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { WalletAddress } from '@/walletAddress/model'
import {
  incomingPaymentRegexp,
  replaceIlpDev,
  transformBalance
} from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '@/rates/service'
import { BadRequest, InternalServerError } from '@shared/backend'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
import { Quote as RhyzaQuote } from '@/rhyza/types'
import { randomUUID } from 'crypto'

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<QuoteWithFees>
}

type CreateQuoteParams = {
  userId: string
  walletAddressId: string
  amount: number
  isReceive: boolean
  receiver: string
  vopNonce?: string
  description?: string
}

type ConvertParams = {
  from: string
  to: string
  amount: bigint
}

export class QuoteService implements IQuoteService {
  constructor(
    private accountService: AccountService,
    private incomingPaymentService: IncomingPaymentService,
    private ratesService: RatesService,
    private walletAddressService: WalletAddressService,
    private rhyzaAdminClient: RhyzaAdminClient
  ) {}

  async create(params: CreateQuoteParams): Promise<QuoteWithFees> {
    const existingWalletAddress = await WalletAddress.query().findById(
      params.walletAddressId
    )

    if (!existingWalletAddress || !existingWalletAddress.active) {
      throw new BadRequest('Invalid wallet address')
    }

    const { assetCode, assetScale } = await this.accountService.findAccountById(
      existingWalletAddress.accountId,
      params.userId
    )

    const account = await this.accountService.getAccountById(
      params.userId,
      existingWalletAddress.accountId
    )
    const balance = account.balance

    const scaledAmount = params.amount * 10 ** assetScale
    if (!Number.isSafeInteger(Math.round(scaledAmount))) {
      throw new BadRequest('Amount is too large')
    }
    const originalValue = BigInt(scaledAmount.toFixed())

    if (Number(balance) < originalValue) {
      throw new BadRequest('Not enough funds in account')
    }

    let value = originalValue

    const isIncomingPayment = incomingPaymentRegexp.test(params.receiver)

    let receiverUrl = params.receiver
    let assetDetails
    if (isIncomingPayment) {
      const payment = await this.incomingPaymentService.getExternalPayment(
        params.receiver
      )
      assetDetails = {
        assetCode: payment.receivedAmount.assetCode,
        assetScale: payment.receivedAmount.assetScale
      }
    } else {
      const receiver = await this.walletAddressService.getByUrl(
        replaceIlpDev(params.receiver)
      )
      // Rhyza doesn't support payment intents at other providers yet.
      if (!receiver) {
        throw new BadRequest(
          'Sending to wallet addresses at other providers is not supported yet'
        )
      }
      if (!receiver.active) {
        throw new BadRequest('Invalid receiver wallet address')
      }
      receiverUrl = receiver.url
      assetDetails = {
        assetCode: receiver.account.assetCode,
        assetScale: receiver.account.assetScale
      }
    }

    if (params.isReceive && assetDetails.assetCode !== assetCode) {
      let convertedValue = await this.convert({
        from: assetCode,
        to: assetDetails.assetCode,
        amount: value
      })
      if (isIncomingPayment) {
        // Optional adjustment; only intents held by this Rhyza instance can be looked up.
        const payment = await this.incomingPaymentService
          .getPaymentDetailsByUrl(params.receiver)
          .catch(() => undefined)

        const amount = payment?.value
          ? transformBalance(payment?.value, assetDetails.assetScale)
          : undefined

        // adjust the amount in case that after converting it to the receiver currency it is off by a small margin
        if (amount && 1 - Number(amount) / Number(convertedValue) < 0.01) {
          convertedValue = amount
        }
      }

      value = convertedValue
    }

    if (value > BigInt(Number.MAX_SAFE_INTEGER)) {
      throw new BadRequest('Amount is too large')
    }

    let paymentIntentType:
      | { paymentIntentId: string }
      | { paymentIntentUrl: string }

    if (isIncomingPayment) {
      paymentIntentType = { paymentIntentUrl: params.receiver }
    } else {
      const { id } = await this.rhyzaAdminClient.createPaymentIntent({
        walletAddress: receiverUrl,
        incomingAmount: params.isReceive ? Number(value) : undefined,
        expiresAt: params.isReceive
          ? undefined
          : new Date(Date.now() + 1000 * 15).toISOString(),
        metadata:
          params.description || params.vopNonce
            ? { description: params.description, vopNonce: params.vopNonce }
            : undefined
      })
      paymentIntentType = { paymentIntentId: id }
    }

    const amountParams = params.isReceive
      ? { receiveAmount: value.toString() }
      : { debitAmount: value.toString() }

    const rhyzaQuote = await this.rhyzaAdminClient.createQuote({
      id: randomUUID(),
      walletAddress: existingWalletAddress.url,
      ...amountParams,
      ...paymentIntentType
    })

    if (rhyzaQuote.state !== 'COMPLETED') {
      throw new BadRequest('Could not calculate quote')
    }

    if (!rhyzaQuote.debitAmount || !rhyzaQuote.receiveAmount) {
      throw new InternalServerError()
    }

    const quote: QuoteWithFees = {
      id: rhyzaQuote.id,
      paymentIntentId: rhyzaQuote.paymentIntentId,
      debitAmount: {
        assetCode,
        assetScale,
        value: rhyzaQuote.debitAmount
      },
      receiveAmount: {
        ...assetDetails,
        value: rhyzaQuote.receiveAmount
      }
    }

    return this.addConversionInfo(
      quote,
      rhyzaQuote,
      params.isReceive ? originalValue : undefined
    )
  }

  private async addConversionInfo(
    quote: QuoteWithFees,
    rhyzaQuote: RhyzaQuote,
    originalValue?: bigint
  ): Promise<QuoteWithFees> {
    if (quote.receiveAmount.assetCode === quote.debitAmount.assetCode) {
      return quote
    }

    const debitValue = BigInt(quote.debitAmount.value)
    let fee: bigint
    if (originalValue) {
      fee = debitValue - originalValue
    } else {
      // Rhyza's exchangeRate is in base units: receiveAmount = debitAmount * exchangeRate.
      const receiveInSenderCurrency = rhyzaQuote.exchangeRate
        ? BigInt(
            Math.floor(
              Number(quote.receiveAmount.value) / rhyzaQuote.exchangeRate
            )
          )
        : await this.convert({
            from: quote.receiveAmount.assetCode,
            to: quote.debitAmount.assetCode,
            amount: BigInt(quote.receiveAmount.value)
          })
      fee = debitValue - receiveInSenderCurrency
    }
    // Rate rounding or drift can push this just below zero.
    if (fee < 0n) fee = 0n

    return {
      ...quote,
      fee: {
        value: fee.toString(),
        assetScale: quote.debitAmount.assetScale,
        assetCode: quote.debitAmount.assetCode
      }
    }
  }

  private async convert(params: ConvertParams): Promise<bigint> {
    const conversionRate = await this.ratesService.getRates(params.from)
    return BigInt(
      (Number(params.amount) * conversionRate.rates[params.to]).toFixed()
    )
  }
}
