import { Model } from 'objection'

export class Account extends Model {
  static tableName = 'accounts'

  id!: string
  name!: string
  assetRafikiId!: string
  assetCode!: string
  userId!: string
  rapydAccountId!: string

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'accounts.userId',
        to: 'users.id'
      }
    }
  })
}
