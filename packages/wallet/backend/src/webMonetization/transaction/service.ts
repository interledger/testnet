import { WMTransaction } from './model'
import { PartialModelObject } from 'objection'
import { Logger } from 'winston'
import {
  IncomingPayment,
  OutgoingPayment
} from '@/rafiki/backend/generated/graphql'
import { PaymentPointerService } from '@/paymentPointer/service'
import { TransactionType } from '@/transaction/model'

export interface IWMTransactionService {}

interface WMTransactionServiceDependencies {
  paymentPointerService: PaymentPointerService
  logger: Logger
}

export class WMTransactionService implements IWMTransactionService {
  constructor(private deps: WMTransactionServiceDependencies) {}

  async updateTransaction(
    where: PartialModelObject<WMTransaction>,
    update: PartialModelObject<WMTransaction>
  ): Promise<void> {
    try {
      this.deps.logger.info(
        `Updating transaction with: ${JSON.stringify(update)}`
      )
      await WMTransaction.query().where(where).update(update)
    } catch (e) {
      this.deps.logger.error(`Update transaction error:`, e)
    }
  }
  async createIncomingTransaction(params: IncomingPayment) {
    const amount = params.incomingAmount || params.receivedAmount
    return WMTransaction.query().insert({
      paymentPointerId: params.paymentPointerId,
      paymentId: params.id,
      expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
      value: amount.value,
      type: 'INCOMING',
      status: 'PENDING'
    })
  }

  async createOutgoingTransaction(params: OutgoingPayment) {
    const amount = params.debitAmount
    return WMTransaction.query().insert({
      paymentPointerId: params.paymentPointerId,
      paymentId: params.id,
      value: amount.value,
      type: 'OUTGOING',
      status: 'PENDING'
    })
  }

  async deleteByTransactionIds(ids: string[]) {
    return WMTransaction.query().del().whereIn('id', ids)
  }

  async deleteByPaymentPointer(
    paymentPointerId: string,
    status: TransactionType
  ) {
    return WMTransaction.query().del().where({ paymentPointerId, status })
  }

  async sumByPaymentPointerId(
    paymentPointerId: string,
    status: TransactionType
  ) {
    return WMTransaction.query()
      .sum('value')
      .where({ paymentPointerId, status })
  }
}
