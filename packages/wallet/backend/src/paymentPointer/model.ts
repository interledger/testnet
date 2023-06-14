import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { Account } from '@/account/model'
import { Transaction } from '@/transaction/model'
export class PaymentPointer extends BaseModel {
  static tableName = 'paymentPointers'

  publicName!: string
  readonly id!: string
  readonly url!: string
  readonly accountId!: string
  active!: boolean
  account!: Account
  transacions!: Array<Transaction>
<<<<<<< HEAD:packages/wallet-backend-update/src/paymentPointer/model.ts
  publicKey!: string 
=======
>>>>>>> c5e9bd332ccc0a11b3ad0cd2b2aba7fccbdd6cfd:packages/wallet/backend/src/paymentPointer/model.ts

  static relationMappings = () => ({
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'paymentPointers.accountId',
        to: 'accounts.id'
      }
    },

    transactions: {
      relation: Model.HasManyRelation,
      modelClass: Transaction,
      join: {
        from: 'paymentPointers.id',
        to: 'transactions.paymentPointerId'
      }
    }
  })
}
