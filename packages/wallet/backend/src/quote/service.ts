import { AccountService } from '@/account/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { WalletAddress } from '@/walletAddress/model'
import { incomingPaymentRegexp, transformBalance } from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '@/rates/service'
import { BadRequest } from '@shared/backend'
import { RhyzaAdminClient } from '@/rhyza/admin-client'
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

    const originalValue = BigInt((params.amount * 10 ** assetScale).toFixed())

    if (Number(balance) < originalValue) {
      throw new BadRequest('Not enough funds in account')
    }

    let value = originalValue

    const isIncomingPayment = incomingPaymentRegexp.test(params.receiver)

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
      const walletAddress =
        await this.walletAddressService.getExternalWalletAddress(
          params.receiver
        )
      assetDetails = {
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale
      }
    }

    if (params.isReceive && assetDetails.assetCode !== assetCode) {
      let convertedValue = await this.convert({
        from: assetCode,
        to: assetDetails.assetCode,
        amount: value
      })
      if (isIncomingPayment) {
        const payment =
          await this.incomingPaymentService.getPaymentDetailsByUrl(
            params.receiver
          )

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

    let paymentIntentType:
      | { paymentIntentId: string }
      | { paymentIntentUrl: string }

    if (isIncomingPayment) {
      paymentIntentType = { paymentIntentUrl: params.receiver }
    } else {
      const { id } = await this.rhyzaAdminClient.createPaymentIntent({
        walletAddress: params.receiver,
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

    if (!rhyzaQuote.debitAmount || !rhyzaQuote.receiveAmount) {
      throw new BadRequest('Could not calculate quote')
    }

    const quote: QuoteWithFees = {
      id: rhyzaQuote.id,
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
      params.isReceive ? originalValue : undefined
    )
  }

  private async addConversionInfo(
    quote: QuoteWithFees,
    originalValue?: bigint
  ): Promise<QuoteWithFees> {
    if (quote.receiveAmount.assetCode === quote.debitAmount.assetCode) {
      return quote
    }
    const value = await this.convert({
      from: quote.receiveAmount.assetCode,
      to: quote.debitAmount.assetCode,
      amount: BigInt(quote.receiveAmount.value)
    })

    const feeInSenderCurrency = BigInt(quote.debitAmount.value) - value

    return {
      ...quote,
      fee: {
        value: (originalValue
          ? BigInt(quote.debitAmount.value) - originalValue
          : feeInSenderCurrency
        ).toString(),
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
