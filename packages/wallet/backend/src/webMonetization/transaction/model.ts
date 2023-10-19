import { TransactionBaseModel } from '@/transaction/model'
import { Model } from 'objection'
import { PaymentPointer } from '../../paymentPointer/model'

export class WMTransaction extends TransactionBaseModel {
  static tableName = 'wmTransactions'

  paymentPointerId!: string
  paymentPointer!: PaymentPointer

  static relationMappings = () => ({
    wmPaymentPointer: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentPointer,
      join: {
        from: 'wmTransactions.paymentPointerId',
        to: 'paymentPointers.id'
      }
    }
  })
}
