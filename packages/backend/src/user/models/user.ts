import bcryptjs from 'bcryptjs'
import { Model } from 'objection'
import { Account } from '../../account/account.model'
import { RefreshToken } from '../../auth/models/refreshToken'

export class User extends Model {
  static tableName = 'users'

  id!: string
  email!: string
  password!: string
  lastName?: string
  firstName?: string
  address?: string
  country?: string
  rapydEWalletReferenceId?: string
  rapydEWalletId?: string
  rapydContactId?: string
  refreshTokens?: Array<RefreshToken>
  account?: Account

  async $beforeInsert() {
    this.password = await bcryptjs.hash(this.password, 10)
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcryptjs.compare(password, this.password)
  }

  static get relationMappings() {
    return {
      refreshTokens: {
        relation: Model.HasManyRelation,
        modelClass: RefreshToken,
        join: {
          from: 'users.id',
          to: 'refreshTokens.userId'
        }
      },
      accounts: {
        relation: Model.HasManyRelation,
        modelClass: Account,
        join: {
          from: 'users.id',
          to: 'accounts.userId'
        }
      }
    }
  }
}
