import { AccountService } from '@/account/service'
import { NotFound } from '@/errors'
import { PaymentDetails } from '@/incomingPayment/controller'
import { PaymentPointer } from '@/paymentPointer/model'
import {
  CreateIncomingPaymentParams,
  RafikiClient
} from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'
import { extractUuidFromUrl, transformAmount } from '@/utils/helpers'

interface IIncomingPaymentService {
  create: (
    userId: string,
    paymentPointerId: string,
    amount: number,
    description: string
  ) => Promise<Transaction>
  getPaymentDetailsByUrl: (url: string) => Promise<PaymentDetails>
  createIncomingPaymentTransactions: (
    params: CreateIncomingPaymentParams
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

    return this.createIncomingPaymentTransactions({
      paymentPointerId,
      description,
      asset,
      amount: BigInt(amount * 10 ** asset.scale)
    })
  }

  async getPaymentDetailsByUrl(url: string): Promise<PaymentDetails> {
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
      value: parseFloat(transformAmount(transaction.value ?? 0n, asset.scale)),
      assetCode: transaction.assetCode
    }
  }

  async createIncomingPaymentTransactions(
    params: CreateIncomingPaymentParams
  ): Promise<Transaction> {
    const response = await this.deps.rafikiClient.createIncomingPayment(params)

    return Transaction.query().insert({
      paymentPointerId: params.paymentPointerId,
      paymentId: response.id,
      assetCode: params.asset.code,
      value: params.amount,
      type: 'INCOMING',
      status: 'PENDING',
      description: params.description
    })
  }
}
