import { AccountService } from '../account/service'
import { BadRequest, NotFound } from '../errors'
import { IncomingPaymentService } from '../incomingPayment/service'
import { PaymentPointer } from '../paymentPointer/model'
import { Asset, Quote } from '../rafiki/generated/graphql'
import { RafikiClient } from '../rafiki/rafiki-client'
import { incomingPaymentRegexp } from '../utils/helpers'

interface IQuoteService {
  create: (
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    receiver: string,
    description?: string
  ) => Promise<Quote>
}

interface QuoteServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

type CreateReceiverParams = {
  amount: bigint | null
  asset: Asset
  paymentPointerUrl: string
  description?: string
  expiresAt?: string
}

export class QuoteService implements IQuoteService {
  constructor(private deps: QuoteServiceDependencies) {}

  async create(
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    receiver: string,
    description?: string
  ): Promise<Quote> {
    const existingPaymentPointer = await PaymentPointer.query().findById(
      paymentPointerId
    )

    if (!existingPaymentPointer || !existingPaymentPointer.active) {
      throw new BadRequest('Invalid payment pointer')
    }

    const { assetId, assetCode } =
      await this.deps.accountService.findAccountById(
        existingPaymentPointer.accountId,
        userId
      )
    const balance = await this.deps.accountService.getAccountBalance(
      userId,
      assetCode
    )

    if (Number(balance) < amount) {
      throw new BadRequest('Not enough funds in account')
    }

    const asset = await this.deps.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const value = BigInt((amount * 10 ** asset.scale).toFixed())

    let paymentUrl = receiver
    if (!incomingPaymentRegexp.test(receiver)) {
      paymentUrl = await this.createReceiver({
        amount: isReceive ? value : null,
        asset,
        paymentPointerUrl: receiver,
        description,
        expiresAt: new Date(Date.now() + 1000 * 60).toISOString()
      })
    }

    return await this.deps.rafikiClient.createQuote({
      paymentPointerId,
      receiver: paymentUrl,
      asset,
      amount: isReceive ? undefined : value
    })
  }

  private async createReceiver(params: CreateReceiverParams): Promise<string> {
    const existingPaymentPointer = await PaymentPointer.query().findOne({
      url: params.paymentPointerUrl ?? ''
    })
    if (!existingPaymentPointer) {
      throw new BadRequest('Invalid payment pointer')
    }

    const response =
      await this.deps.incomingPaymentService.createIncomingPaymentTransactions({
        ...params,
        paymentPointerId: existingPaymentPointer.id
      })

    return `${existingPaymentPointer.url}/incoming-payments/${response.paymentId}`
  }
}
