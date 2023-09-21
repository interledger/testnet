import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@/errors'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { PaymentPointer } from '@/paymentPointer/model'
import { Asset, Quote } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { incomingPaymentRegexp, urlToPaymentPointer } from '@/utils/helpers'
import { PaymentPointerService } from '../paymentPointer/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '../rates/service'

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
}

interface QuoteServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
  ratesService: RatesService
  paymentPointerService: PaymentPointerService
}

type CreateQuoteParams = {
  userId: string
  paymentPointerId: string
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
  constructor(private deps: QuoteServiceDependencies) {}

  async create(params: CreateQuoteParams): Promise<QuoteWithFees> {
    const existingPaymentPointer = await PaymentPointer.query().findById(
      params.paymentPointerId
    )

    if (!existingPaymentPointer || !existingPaymentPointer.active) {
      throw new BadRequest('Invalid payment pointer')
    }

    const { assetId, assetCode } =
      await this.deps.accountService.findAccountById(
        existingPaymentPointer.accountId,
        params.userId
      )
    const balance = await this.deps.accountService.getAccountBalance(
      params.userId,
      assetCode
    )

    if (Number(balance) < params.amount) {
      throw new BadRequest('Not enough funds in account')
    }

    let asset: Pick<Asset, 'scale' | 'code'> | undefined =
      await this.deps.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const originalValue = BigInt((params.amount * 10 ** asset.scale).toFixed())
    let value = originalValue

    let paymentUrl = params.receiver

    const isIncomingPayment = incomingPaymentRegexp.test(params.receiver)

    const destinationPaymentPointer =
      await this.deps.paymentPointerService.getExternalPaymentPointer(
        isIncomingPayment ? urlToPaymentPointer(paymentUrl) : paymentUrl
      )

    if (
      params.isReceive &&
      destinationPaymentPointer.assetCode !== asset.code
    ) {
      const convertedValue = await this.convert({
        from: assetCode,
        to: destinationPaymentPointer.assetCode,
        amount: value
      })
      value = convertedValue

      //* This next check is for first-party transfers. Future Third party transfers will need to go through another flow.
      // TODO: discuss if this check is required
      // const assetList = await this.deps.rafikiClient.listAssets({ first: 100 })
      // asset = assetList.find(
      //   (a) => a.code === destinationPaymentPointer.assetCode
      // )
      // if (!asset) {
      //   throw new BadRequest(
      //     'Destination payment pointer asset is not supported'
      //   )
      // }

      asset = {
        code: destinationPaymentPointer.assetCode,
        scale: destinationPaymentPointer.assetScale
      }
    }

    if (!isIncomingPayment) {
      paymentUrl = await this.deps.incomingPaymentService.createReceiver({
        amount: params.isReceive ? value : null,
        asset: {
          code: destinationPaymentPointer.assetCode,
          scale: destinationPaymentPointer.assetScale
        },
        paymentPointerUrl: params.receiver,
        description: params.description,
        expiresAt: new Date(Date.now() + 1000 * 15)
      })
    }

    const amountParams = {
      assetCode: asset.code,
      assetScale: asset.scale,
      value
    }

    const quote = await this.deps.rafikiClient.createQuote({
      paymentPointerId: params.paymentPointerId,
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
    const conversionRate = await this.deps.ratesService.getRates(params.from)
    return BigInt(
      (Number(params.amount) * conversionRate.rates[params.to]).toFixed()
    )
  }
}
