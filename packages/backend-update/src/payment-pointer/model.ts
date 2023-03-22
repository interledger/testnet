import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { Account } from '@/account/model'

export class PaymentPointer extends BaseModel {
  static tableName = 'paymentPointers'

  public publicName!: string
  public readonly id!: string
  public readonly url!: string
  public readonly accountId!: string
  public Account!: Account

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
