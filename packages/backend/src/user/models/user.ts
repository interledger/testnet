import bcryptjs from 'bcryptjs'
import { Model } from 'objection'
import { RefreshToken } from '../../auth/models/refreshToken'

export class User extends Model {
  static tableName = 'users'

  id!: string
  email!: string
  password!: string
  lastName?: string
  firstName?: string
  rapydWalletId?: string
  rapydContactId?: string
  refreshTokens?: Array<RefreshToken>

  async $beforeInsert() {
    this.password = await bcryptjs.hash(this.password, 10)
  }

  async verifyPassword(password: string): Promise<boolean> {
    console.log(password, this.password)
    return bcryptjs.compare(password, this.password)
  }

  static get relationMappings() {
    return {
      refreshTokens: {
        relation: Model.HasManyRelation,
        modelClass: RefreshToken,
        join: {
          from: 'users.id',
          to: 'refresh_tokens.userId'
        }
      }
    }
  }
}
