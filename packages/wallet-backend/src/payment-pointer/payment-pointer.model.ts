import { Model } from 'objection'
import { Account } from '../account/account.model'

export class PaymentPointerModel extends Model {
  static tableName = 'paymentPointers'

  id!: string
  publicName!: string
  accountId!: string
  url!: string
  account!: Account

  static relationMappings = () => ({
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'paymentPointers.accountId',
        to: 'accounts.id'
      }
    }
  })
}
