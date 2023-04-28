import { Model } from 'objection'

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
  updatedAt!: string
  createdAt!: string

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: TransactionModel,
      join: {
        from: 'transactions.paymentPointerId',
        to: 'paymentPointers.id'
      }
    }
  })
}
