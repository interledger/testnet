import { Account } from '@/account/model'
import { Session } from '@/session/model'
import { Model, ModelOptions, QueryContext } from 'objection'
import { bcryptVerify } from 'hash-wasm'
import { encryptPassword } from '@/utils/helpers'
import { BaseModel } from '@shared/backend'

export class User extends BaseModel {
  static tableName = 'users'

  public email!: string
  public verifyEmailToken?: string | null
  public isEmailVerified!: boolean
  private password!: string

  public lastName?: string
  public firstName?: string
  public address?: string
  public country?: string

  public kycVerified!: boolean
  public gateHubUserId?: string
  public customerId?: string
  public isPinSet!: boolean

  public sessions?: Session[]
  public passwordResetToken?: string | null
  public passwordResetExpiresAt?: Date | null

  // this property is used to update the password
  public newPassword?: string

  async $beforeInsert(queryContext: QueryContext): Promise<void> {
    super.$beforeInsert(queryContext)
    this.password = await encryptPassword(this.password)
  }

  async $beforeUpdate(
    options: ModelOptions,
    queryContext: QueryContext
  ): Promise<void> {
    super.$beforeUpdate(options, queryContext)
    if (this.newPassword) {
      this.password = await encryptPassword(this.newPassword)
      delete this.newPassword
    }
  }

  async verifyPassword(password: string): Promise<boolean> {
    return bcryptVerify({ password, hash: this.password })
  }

  static get relationMappings() {
    return {
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: Session,
        join: {
          from: 'users.id',
          to: 'sessions.userId'
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
