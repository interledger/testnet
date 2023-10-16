import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { PaymentPointer } from '@/paymentPointer/model'
import { Account } from '@/account/model'

export type TransactionExtended = Transaction & {
  paymentPointerUrl: PaymentPointer['url']
  accountName: Account['name']
}

export class TransactionBaseModel extends BaseModel {
  paymentId!: string
  value!: bigint | null
  type!: 'INCOMING' | 'OUTGOING'
  status!: 'PENDING' | 'COMPLETED' | 'REJECTED' | 'EXPIRED'
  expiresAt!: Date | null
}

export class Transaction extends TransactionBaseModel {
  static tableName = 'transactions'

  description?: string
  paymentPointerId?: string
  accountId!: string
  assetCode!: string
  value!: bigint | null
  paymentPointer!: PaymentPointer

  static relationMappings = () => ({
    paymentPointer: {
      relation: Model.BelongsToOneRelation,
      modelClass: PaymentPointer,
      join: {
        from: 'transactions.paymentPointerId',
        to: 'paymentPointers.id'
      }
    },
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'transactions.accountId',
        to: 'accounts.id'
      }
    }
  })
}
