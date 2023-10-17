import { Account } from '@/account/model'
import { PaymentPointerBaseModel } from '@/paymentPointer/model'
import { Model } from 'objection'
import { WMTransaction } from '../transaction/model'

export class WMPaymentPointer extends PaymentPointerBaseModel {
  static tableName = 'wmPaymentPointers'

  public balance!: bigint
  public assetCode!: string
  public assetScale!: number

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
      modelClass: WMTransaction,
      join: {
        from: 'wmPaymentPointers.id',
        to: 'wmTransactions.wmPaymentPointerId'
      }
    }
  })
}
