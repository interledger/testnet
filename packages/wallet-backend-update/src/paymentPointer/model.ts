import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { Account } from '@/account/model'

export class PaymentPointer extends BaseModel {
  static tableName = 'paymentPointers'

  publicName!: string
  readonly id!: string
  readonly url!: string
  readonly accountId!: string
  active!: boolean
  Account!: Account

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
