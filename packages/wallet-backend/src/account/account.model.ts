import { Model } from 'objection'
import { PaymentPointerModel } from '../payment-pointer/payment-pointer.model'
import { User } from '../user/models/user'

export class Account extends Model {
  static tableName = 'accounts'

  id!: string
  name!: string
  assetRafikiId!: string
  assetCode!: string
  userId!: string
  rapydVirtualBankAccountId!: string
  paymentPointers?: Array<PaymentPointerModel>
  user!: User
  balance!: string

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'accounts.userId',
        to: 'users.id'
      }
    },
    paymentPointers: {
      relation: Model.HasManyRelation,
      modelClass: PaymentPointerModel,
      join: {
        from: 'accounts.id',
        to: 'paymentPointers.accountId'
      }
    }
  })
}
