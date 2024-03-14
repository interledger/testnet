import { User } from '@/user/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend/src/model'

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
