import { AccountService } from '../account/service'
import { BadRequest, NotFound } from '../errors'
import { IncomingPaymentService } from '../incomingPayment/service'
import { PaymentPointer } from '../paymentPointer/model'
import { Quote } from '../rafiki/generated/graphql'
import { RafikiClient } from '../rafiki/rafiki-client'
import { incomingPaymentRegexp } from '../utils/helpers'

interface IQuoteService {
  create: (params: CreateQuoteParams) => Promise<Quote>
}

interface QuoteServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

type CreateQuoteParams = {
  userId: string
  paymentPointerId: string
  amount: number
  isReceive: boolean
  receiver: string
  description?: string
}

export class QuoteService implements IQuoteService {
  constructor(private deps: QuoteServiceDependencies) {}

  async create(params: CreateQuoteParams): Promise<Quote> {
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

    const asset = await this.deps.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    const value = BigInt((params.amount * 10 ** asset.scale).toFixed())

    let paymentUrl = params.receiver
    if (!incomingPaymentRegexp.test(params.receiver)) {
      paymentUrl = await this.deps.incomingPaymentService.createReceiver({
        amount: params.isReceive ? value : null,
        asset,
        paymentPointerUrl: params.receiver,
        description: params.description,
        expiresAt: new Date(Date.now() + 1000 * 60).toISOString()
      })
    }

    return this.deps.rafikiClient.createQuote({
      paymentPointerId: params.paymentPointerId,
      receiver: paymentUrl,
      asset,
      amount: params.isReceive ? undefined : value
    })
  }
}
