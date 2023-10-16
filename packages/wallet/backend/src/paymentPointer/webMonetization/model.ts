import { Model } from 'objection'
import { Account } from '@/account/model'
import { Transaction } from '@/transaction/model'
import { PaymentPointerBaseModel } from '../model'

export class WMPaymentPointerBaseModel extends PaymentPointerBaseModel {
  assetCode!: string
  assetScale!: number
  balance!: number
}

export class WMPaymentPointer extends WMPaymentPointerBaseModel {
  static tableName = 'wmPaymentPointers'

  static relationMappings = () => ({
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'wmPaymentPointers.accountId',
        to: 'accounts.id'
      }
    },

    transactions: {
      relation: Model.HasManyRelation,
      modelClass: Transaction,
      join: {
        from: 'wmPaymentPointers.id',
        to: 'wmTransactions.wmPaymentPointerId'
      }
    }
  })
}
