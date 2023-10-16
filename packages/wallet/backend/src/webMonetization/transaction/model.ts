import { TransactionBaseModel } from '@/transaction/model'
import { WMPaymentPointer } from '../paymentPointer/model'
import { Model } from 'objection'

export class WMTransaction extends TransactionBaseModel {
  static tableName = 'wmTransactions'

  wmPaymentPointerId!: string
  wmPaymentPointer!: WMPaymentPointer

  static relationMappings = () => ({
    paymentPointer: {
      relation: Model.BelongsToOneRelation,
      modelClass: WMPaymentPointer,
      join: {
        from: 'wmTransactions.wmPaymentPointerId',
        to: 'wmPaymentPointers.id'
      }
    }
  })
}
