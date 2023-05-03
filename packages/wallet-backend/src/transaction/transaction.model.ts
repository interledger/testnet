import { Model } from 'objection'
import { PaymentPointerModel } from '../payment-pointer/payment-pointer.model'

export class TransactionModel extends Model {
  static tableName = 'transactions'

  id!: string
  paymentId!: string
  description?: string
  paymentPointerId!: string
  assetCode!: string
  value!: bigint | null
  type!: 'INCOMING' | 'OUTGOING'
  status!: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  paymentPointer!: PaymentPointerModel
  updatedAt!: string
  createdAt!: string

  static relationMappings = () => ({
    paymentPointer: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentPointerModel,
      join: {
        from: 'transactions.paymentPointerId',
        to: 'paymentPointers.id'
      }
    }
  })
}
