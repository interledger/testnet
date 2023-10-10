import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@/errors'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { PaymentPointer } from '@/paymentPointer/model'
import { Asset, Quote } from '@/rafiki/backend/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import {
  incomingPaymentRegexp,
  transformBalance,
  urlToPaymentPointer
} from '@/utils/helpers'
import {
  createPaymentPointerIfFalsy,
  PaymentPointerService
} from '../paymentPointer/service'
import { QuoteWithFees } from './controller'
import { RatesService } from '../rates/service'
import { Account } from '@/account/model'

type CreateExchangeQuote = {
  userId: string
  accountId: string
  assetCode: string
  amount: number
}

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
  createExchangeQuote: (args: CreateExchangeQuote) => Promise<QuoteWithFees>
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

const getAccountWithPaymentPointerBy = async (where: Partial<Account>) => {
  const account = await Account.query()
    .where(where)
    .withGraphFetched({ paymentPointers: true })
    .modifyGraph('paymentPointers', (builder) => {
      builder.where({ active: true }).orderBy('createdAt', 'ASC').limit(1)
    })
    .limit(1)
    .first()

  return account
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
      let convertedValue
      if (isIncomingPayment) {
        const payment = await this.deps.incomingPaymentService.getReceiver(
          params.receiver
        )
        convertedValue = payment?.value
          ? transformBalance(
              payment?.value,
              destinationPaymentPointer.assetScale
            )
          : undefined
      }

      if (!convertedValue) {
        convertedValue = await this.convert({
          from: assetCode,
          to: destinationPaymentPointer.assetCode,
          amount: value
        })
      }

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

  public async createExchangeQuote({
    userId,
    accountId,
    assetCode,
    amount
  }: CreateExchangeQuote): Promise<QuoteWithFees> {
    const accountFrom = await getAccountWithPaymentPointerBy({
      userId,
      id: accountId
    })

    if (!accountFrom) {
      throw new NotFound(`The source account does not exist for this user.`)
    }

    const rafikiAsset = await this.deps.rafikiClient.getRafikiAsset(assetCode)
    if (!rafikiAsset) {
      throw new NotFound(
        `Asset Code "${assetCode}" does not exist in Rafiki; Payment Pointer could not be automatically created.`
      )
    }

    const senderPp = await createPaymentPointerIfFalsy({
      paymentPointer: accountFrom.paymentPointers?.[0],
      userId,
      accountId: accountFrom.id,
      publicName: `Exchange Payment Pointer (exchanging into ${assetCode})`,
      paymentPointerService: this.deps.paymentPointerService
    })
    const senderPpId = senderPp.id

    let accountTo = await getAccountWithPaymentPointerBy({ userId, assetCode })

    if (!accountTo) {
      accountTo = await this.deps.accountService.createAccount({
        name: `${assetCode} account`,
        userId,
        assetId: rafikiAsset.id
      })
    }

    const receiverPp = await createPaymentPointerIfFalsy({
      paymentPointer: accountTo.paymentPointers?.[0],
      userId,
      accountId: accountTo.id,
      publicName: `${assetCode} Payment Pointer`,
      paymentPointerService: this.deps.paymentPointerService
    })
    const receiverPpUrl = receiverPp.url

    const quote = await this.create({
      userId,
      paymentPointerId: senderPpId,
      amount,
      description: 'Currency exchange.',
      isReceive: false,
      receiver: receiverPpUrl
    })

    return quote
  }
}
