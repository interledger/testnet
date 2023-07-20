import { AccountService } from '@/account/service'
import { BadRequest, NotFound } from '@/errors'
import { PaymentDetails } from '@/incomingPayment/controller'
import { PaymentPointer } from '@/paymentPointer/model'
import {
  CreateIncomingPaymentParams,
  RafikiClient
} from '@/rafiki/rafiki-client'
import { Transaction } from '@/transaction/model'
import { extractUuidFromUrl, transformAmount } from '@/utils/helpers'
import { Asset } from '@/rafiki/backend/generated/graphql'
import { add } from 'date-fns'

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

type CreateReceiverParams = {
  amount: bigint | null
  asset: Asset
  paymentPointerUrl: string
  description?: string
  expiresAt?: string
}

export class IncomingPaymentService implements IIncomingPaymentService {
  constructor(private deps: IncomingPaymentServiceDependencies) {}

  async create(
    userId: string,
    paymentPointerId: string,
    amount: number,
    description?: string,
    expiry?: number,
    unit?: string
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

    let expiryDate: Date | undefined

    if (expiry && unit) {
      expiryDate = add(new Date(), this.generateExpiryObject(expiry, unit))
    }

    return this.createIncomingPaymentTransactions({
      paymentPointerId,
      description,
      asset,
      amount: BigInt(amount * 10 ** asset.scale),
      expiresAt: expiryDate?.toISOString()
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

  public async createReceiver(params: CreateReceiverParams): Promise<string> {
    const existingPaymentPointer = await PaymentPointer.query().findOne({
      url: params.paymentPointerUrl ?? ''
    })
    if (!existingPaymentPointer) {
      throw new BadRequest('Invalid payment pointer')
    }

    const response = await this.createIncomingPaymentTransactions({
      ...params,
      paymentPointerId: existingPaymentPointer.id
    })

    return `${existingPaymentPointer.url}/incoming-payments/${response.paymentId}`
  }

  private generateExpiryObject(expiry: number, unit: string): Duration {
    switch (unit) {
      case 's': {
        return {
          seconds: expiry
        }
      }
    }

    return {days: 30}
  }
}
