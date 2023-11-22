import { WMTransaction } from './model'
import { PartialModelObject, TransactionOrKnex } from 'objection'
import { Logger } from 'winston'
import {
  IncomingPayment,
  OutgoingPayment
} from '@/rafiki/backend/generated/graphql'
import { TransactionType } from '@/transaction/model'
import { addMinutes } from 'date-fns'

export interface IWMTransactionService {}

export class WMTransactionService implements IWMTransactionService {
  constructor(private logger: Logger) {}

  async updateTransaction(
    where: PartialModelObject<WMTransaction>,
    update: PartialModelObject<WMTransaction>
  ): Promise<void> {
    try {
      this.logger.info(`Updating transaction with: ${JSON.stringify(update)}`)
      await WMTransaction.query().where(where).update(update)
    } catch (e) {
      this.logger.error(`Update transaction error:`, e)
    }
  }
  async createIncomingTransaction(params: IncomingPayment) {
    return WMTransaction.query().insert({
      walletAddressId: params.walletAddressId,
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
      walletAddressId: params.walletAddressId,
      paymentId: params.id,
      value: amount.value,
      type: 'OUTGOING',
      status: 'PENDING'
    })
  }

  async deleteByTransactionIds(ids: string[], trx?: TransactionOrKnex) {
    return WMTransaction.query(trx).del().whereIn('id', ids)
  }

  async sumByWalletAddressId(
    walletAddressId: string,
    type: TransactionType,
    trx?: TransactionOrKnex
  ) {
    const transactions = await WMTransaction.query(trx).where({
      walletAddressId,
      type,
      status: 'COMPLETED'
    })
    const ids = transactions.map(({ id }) => id)
    const sumResult = (await WMTransaction.query(trx)
      .whereIn('id', ids)
      .sum('value')) as unknown as [{ sum: bigint }]

    return {
      ids,
      sum: sumResult[0].sum ?? 0n
    }
  }
}
