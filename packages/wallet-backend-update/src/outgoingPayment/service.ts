import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@/errors'
import { PaymentPointer } from '@/paymentPointer/model'
import { Asset } from '@/rafiki/generated/graphql'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'
import { CreateOutgoingPaymentResponse } from './controller'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { incomingPaymentRegexp } from '@/utils/helpers'

interface IOutgoingPaymentService {
  create: (
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    receiver: string,
    description?: string
  ) => Promise<CreateOutgoingPaymentResponse>
}

interface OutgoingServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

// type AcceptQuoteParams = {
//   paymentPointerId: string
//   quoteId: string
//   assetCode: string
//   value: bigint
//   description?: string
// }

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private deps: OutgoingServiceDependencies) {}

  async create(
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    receiver: string,
    description?: string
  ): Promise<CreateOutgoingPaymentResponse> {
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

    const value = BigInt(amount * 10 ** asset.scale)

    let paymentUrl = receiver
    if (!incomingPaymentRegexp.test(receiver)) {
      paymentUrl = await this.createReceiver(
        isReceive ? value : null,
        asset,
        receiver,
        description,
        new Date(Date.now() + 1000 * 60).toISOString()
      )
    }

    const quote = await this.deps.rafikiClient.createQuote({
      paymentPointerId,
      receiver: paymentUrl,
      asset,
      amount: isReceive ? undefined : value
    })

    return { ...quote, assetCode, value, description }
  }

  async acceptQuote(quoteId: string): Promise<Transaction> {
    const quote = await this.deps.rafikiClient.getQuote(quoteId)

    const paymentPointerId = quote.paymentPointerId
    const amount = quote.receiveAmount

    let description
    let assetCode = quote.receiveAmount.assetCode
    let value = quote.receiveAmount.value

    if (!amount) {
      const incomingPayment =
        await this.deps.incomingPaymentService.getPaymentDetailsByUrl(
          quote.receiver
        )
      description = incomingPayment.description
      assetCode = incomingPayment.assetCode
      value = value ?? BigInt(incomingPayment.value)
    }

    const payment = await this.deps.rafikiClient.createOutgoingPayment(
      paymentPointerId,
      quoteId,
      description
    )

    return Transaction.query().insert({
      paymentPointerId: paymentPointerId,
      paymentId: payment.id,
      assetCode,
      value: value,
      type: 'OUTGOING',
      status: 'PENDING',
      description
    })
  }

  private async createReceiver(
    amount: bigint | null,
    asset: Asset,
    paymentPointerUrl = '',
    description?: string,
    expiresAt?: string
  ): Promise<string> {
    const existingPaymentPointer = await PaymentPointer.query().findOne({
      url: paymentPointerUrl
    })
    if (!existingPaymentPointer) {
      throw new BadRequest('Invalid payment pointer')
    }

    const response =
      await this.deps.incomingPaymentService.createIncomingPaymentTransactions(
        existingPaymentPointer.id,
        amount,
        asset,
        description,
        expiresAt
      )

    return `${existingPaymentPointer.url}/incoming-payments/${response.paymentId}`
  }
}
