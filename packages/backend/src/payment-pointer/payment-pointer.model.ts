import { Model } from 'objection'
import { Account } from '../account/account.model'

export class PaymentPointerModel extends Model {
  static tableName = 'paymentPointers'

  id!: string
  publicName!: string
  accountId!: string
  url!: string

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'paymentPointers.accountId',
        to: 'accounts.id'
      }
    }
  })
}

const test = PaymentPointerModel.query()
  .findOne({ id: 'id' })
  .withGraphJoined('accounts')
  .where('accounts.id', '=', 'paymentPointers.accountId')
  .withGraphJoined('users')
  .where('users.id', '=', 'accounts.userId')
