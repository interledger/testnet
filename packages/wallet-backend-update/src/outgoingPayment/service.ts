import { Transaction } from '@/transaction/model'
import { AccountService } from '@/account/service'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { BadRequest, NotFound } from '@/errors'
import { PaymentPointer } from '@/paymentPointer/model'
import { Asset } from '@/rafiki/generated/graphql'
import { IncomingPaymentService } from '@/incomingPayment/service'

interface IOutgoingPaymentService {
  create: (
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    incomingPaymentUrl?: string,
    toPaymentPointerUrl?: string,
    description?: string
  ) => Promise<Transaction>
}

interface OutgoingServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
  incomingPaymentService: IncomingPaymentService
}

export class OutgoingPaymentService implements IOutgoingPaymentService {
  constructor(private deps: OutgoingServiceDependencies) {}

  async create(
    userId: string,
    paymentPointerId: string,
    amount: number,
    isReceive: boolean,
    incomingPaymentUrl?: string,
    toPaymentPointerUrl?: string,
    description?: string
  ): Promise<Transaction> {
    if (!incomingPaymentUrl && !toPaymentPointerUrl) {
      throw new BadRequest(
        'incomingPaymentUrl or toPaymentPointerUrl should be defined'
      )
    }

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

    const paymentUrl: string =
      incomingPaymentUrl ||
      (await this.createReceiver(
        isReceive ? BigInt(amount * 10 ** asset.scale) : null,
        asset,
        toPaymentPointerUrl,
        description,
        new Date(Date.now() + 1000 * 60).toISOString()
      ))

    const quote = await this.deps.rafikiClient.createQuote({
      paymentPointerId,
      receiver: paymentUrl,
      asset,
      amount: isReceive ? undefined : BigInt(amount * 10 ** asset.scale)
    })
    const payment = await this.deps.rafikiClient.createOutgoingPayment(
      paymentPointerId,
      quote.id,
      description
    )

    return Transaction.query().insert({
      paymentPointerId: existingPaymentPointer.id,
      paymentId: payment.id,
      assetCode: asset.code,
      value: BigInt(amount * 10 ** asset.scale),
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
