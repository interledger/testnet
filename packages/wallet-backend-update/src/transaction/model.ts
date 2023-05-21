import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { PaymentPointer } from '@/paymentPointer/model'
export class Transaction extends BaseModel {
  static tableName = 'transactions'

  id!: string
  paymentId!: string
  description?: string
  paymentPointerId!: string
  assetCode!: string
  value!: bigint | null
  type!: 'INCOMING' | 'OUTGOING'
  status!: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  paymentPointer!: PaymentPointer

  static relationMappings = () => ({
    paymentPointer: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentPointer,
      join: {
        from: 'transactions.paymentPointerId',
        to: 'paymentPointers.id'
      }
    }
  })
}
