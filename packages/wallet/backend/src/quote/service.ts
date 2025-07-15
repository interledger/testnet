import { AccountService } from '@/account/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { WalletAddress } from '@/walletAddress/model'
import { Asset, Quote } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { incomingPaymentRegexp, transformBalance } from '@/utils/helpers'
import { WalletAddressService } from '@/walletAddress/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '@/rates/service'
import { BadRequest, NotFound } from '@shared/backend'

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
}

type CreateQuoteParams = {
  userId: string
  walletAddressId: string
  amount: number
  isReceive: boolean
  receiver: string
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
    private rafikiClient: RafikiClient,
    private incomingPaymentService: IncomingPaymentService,
    private ratesService: RatesService,
    private walletAddressService: WalletAddressService
  ) {}

  async create(params: CreateQuoteParams): Promise<QuoteWithFees> {
    const existingWalletAddress = await WalletAddress.query().findById(
      params.walletAddressId
    )

    if (!existingWalletAddress || !existingWalletAddress.active) {
      throw new BadRequest('Invalid wallet address')
    }

    const { assetId, assetCode } = await this.accountService.findAccountById(
      existingWalletAddress.accountId,
      params.userId
    )

    let asset: Pick<Asset, 'scale' | 'code'> | undefined =
      await this.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const account = await this.accountService.getAccountById(
      params.userId,
      existingWalletAddress.accountId
    )
    const balance = account.balance

    const originalValue = BigInt((params.amount * 10 ** asset.scale).toFixed())

    if (Number(balance) < originalValue) {
      throw new BadRequest('Not enough funds in account')
    }

    let value = originalValue

    let paymentUrl = params.receiver

    const isIncomingPayment = incomingPaymentRegexp.test(params.receiver)

    let assetDetails
    if (isIncomingPayment) {
      const payment =
        await this.incomingPaymentService.getExternalPayment(paymentUrl)
      assetDetails = {
        assetCode: payment.receivedAmount.assetCode,
        assetScale: payment.receivedAmount.assetScale
      }
    } else {
      const walletAddress =
        await this.walletAddressService.getExternalWalletAddress(paymentUrl)
      assetDetails = {
        assetCode: walletAddress.assetCode,
        assetScale: walletAddress.assetScale
      }
    }

    if (params.isReceive && assetDetails.assetCode !== asset.code) {
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

      asset = {
        code: assetDetails.assetCode,
        scale: assetDetails.assetScale
      }
    }

    if (!isIncomingPayment) {
      paymentUrl = await this.incomingPaymentService.createReceiver({
        amount: params.isReceive ? value : null,
        asset: {
          code: assetDetails.assetCode,
          scale: assetDetails.assetScale
        },
        walletAddressUrl: params.receiver,
        description: params.description,
        expiresAt: new Date(Date.now() + 1000 * 15)
      })
    }

    const amountParams = {
      assetCode: asset.code,
      assetScale: asset.scale,
      value
    }

    const quote = await this.rafikiClient.createQuote({
      walletAddressId: params.walletAddressId,
      receiveAmount: params.isReceive ? amountParams : undefined,
      receiver: paymentUrl,
      debitAmount: params.isReceive ? undefined : amountParams
    })

    return this.addConversionInfo(
      quote,
      params.isReceive ? originalValue : undefined
    )
  }

  private async addConversionInfo(
    quote: Quote,
    originalValue?: bigint
  ): Promise<QuoteWithFees | Quote> {
    if (quote.receiveAmount.assetCode === quote.debitAmount.assetCode) {
      return quote
    }
    const value = await this.convert({
      from: quote.receiveAmount.assetCode,
      to: quote.debitAmount.assetCode,
      amount: quote.receiveAmount.value
    })

    const feeInSenderCurrency = BigInt(quote.debitAmount.value) - value

    return {
      ...quote,
      fee: {
        value: originalValue
          ? BigInt(quote.debitAmount.value) - originalValue
          : feeInSenderCurrency,
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
