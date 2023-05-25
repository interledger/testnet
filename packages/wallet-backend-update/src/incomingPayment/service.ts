import { Transaction } from '@/transaction/model'
import { AccountService } from '@/account/service'
import { PaymentDetails } from '@/incomingPayment/controller'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { PaymentPointer } from '@/paymentPointer/model'
import { NotFound } from '@/errors'
import { extractUuidFromUrl, transformAmount } from '@/utils/helpers'
import { Asset } from '@/rafiki/generated/graphql'

interface IIncomingPaymentService {
  create: (
    userId: string,
    paymentPointerId: string,
    amount: number,
    description: string
  ) => Promise<Transaction>
  getPaymentDetailsByUrl: (url: string) => Promise<PaymentDetails>
  createIncomingPaymentTransactions: (
    paymentPointerId: string,
    amount: bigint | null,
    asset: Asset,
    description?: string,
    expiresAt?: string
  ) => Promise<Transaction>
}

interface IncomingPaymentServiceDependencies {
  accountService: AccountService
  rafikiClient: RafikiClient
}

export class IncomingPaymentService implements IIncomingPaymentService {
  constructor(private deps: IncomingPaymentServiceDependencies) {}

  async create(
    userId: string,
    paymentPointerId: string,
    amount: number,
    description?: string
  ): Promise<Transaction> {
    const existingPaymentPointer = await PaymentPointer.query().findById(
      paymentPointerId
    )
    if (!existingPaymentPointer || !existingPaymentPointer.active) {
      throw new NotFound()
    }

    const { assetId } = await this.deps.accountService.findAccountById(
      existingPaymentPointer.accountId,
      userId
    )
    const asset = await this.deps.rafikiClient.getAssetById(assetId)
    if (!asset) {
      throw new NotFound()
    }

    return this.createIncomingPaymentTransactions(
      paymentPointerId,
      BigInt(amount * 10 ** asset.scale),
      asset,
      description
    )
  }

  async getPaymentDetailsByUrl(url: string) {
    const id = extractUuidFromUrl(url)

    const transaction = await Transaction.query()
      .where('paymentId', id)
      .where('status', 'PENDING')
      .first()
      .withGraphFetched({ paymentPointer: { account: true } })

    if (!transaction) {
      throw new NotFound(
        'The provided incoming payment URL could not be found.'
      )
    }

    const asset = await this.deps.rafikiClient.getAssetById(
      transaction.paymentPointer?.account.assetId
    )
    if (!asset) {
      throw new NotFound()
    }

    return {
      description: transaction.description,
      value: transformAmount(transaction.value ?? 0, asset.scale)
    }
  }

  async createIncomingPaymentTransactions(
    paymentPointerId: string,
    amount: bigint | null,
    asset: Asset,
    description?: string,
    expiresAt?: string
  ): Promise<Transaction> {
    const response = await this.deps.rafikiClient.createIncomingPayment({
      amount,
      asset,
      description,
      expiresAt,
      paymentPointerId
    })

    return Transaction.query().insert({
      paymentPointerId: paymentPointerId,
      paymentId: response.id,
      assetCode: asset.code,
      value: amount,
      type: 'INCOMING',
      status: 'PENDING',
      description
    })
  }
}
