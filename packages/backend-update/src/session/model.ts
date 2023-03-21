import { BaseModel } from '@/shared/model'
import { User } from '@/user/model'
import { Model } from 'objection'

export class Session extends BaseModel {
  static tableName = 'sessions'

  public expiresAt!: Date

  public readonly userId!: string

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'sessions.userId',
        to: 'users.id'
      }
    }
  })
}
