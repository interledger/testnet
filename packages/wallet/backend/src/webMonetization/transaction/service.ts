import { WMTransaction } from './model'
import { PartialModelObject } from 'objection'
import { Logger } from 'winston'
import {
  IncomingPayment,
  OutgoingPayment
} from '@/rafiki/backend/generated/graphql'
import { TransactionType } from '@/transaction/model'
import { addMinutes } from 'date-fns'

export interface IWMTransactionService {}

interface WMTransactionServiceDependencies {
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
    return WMTransaction.query().insert({
      paymentPointerId: params.paymentPointerId,
      paymentId: params.id,
      expiresAt: params.expiresAt
        ? new Date(params.expiresAt)
        : addMinutes(new Date(), 10),
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

  async sumByPaymentPointerId(paymentPointerId: string, type: TransactionType) {
    const transactions = await WMTransaction.query().where({
      paymentPointerId,
      type,
      status: 'COMPLETED'
    })
    const ids = transactions.map(({ id }) => id)
    const sumResult = (await WMTransaction.query()
      .whereIn('id', ids)
      .sum('value')) as unknown as [{ sum: bigint }]

    return {
      ids,
      sum: sumResult[0].sum
    }
  }
}
