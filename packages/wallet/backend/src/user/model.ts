import { Account } from '@/account/model'
import { BaseModel } from '@/shared/model'
import { Session } from '@/session/model'
import { Model, ModelOptions, QueryContext } from 'objection'
import { bcryptVerify } from 'hash-wasm'
import { encryptPassword } from '@/utils/helpers'

export class User extends BaseModel {
  static tableName = 'users'

  public email!: string
  public password!: string
  public lastName?: string
  public firstName?: string
  public address?: string
  public country?: string
  public rapydReferenceId?: string
  public rapydWalletId?: string
  public rapydContactId?: string
  public kycId?: string
  public sessions?: Session[]
  public passwordResetToken?: string | null
  public passwordResetExpiresAt?: Date | null

  async $beforeInsert(queryContext: QueryContext): Promise<void> {
    super.$beforeInsert(queryContext)
    this.password = await encryptPassword(this.password)
  }

  async $beforeUpdate(
    options: ModelOptions,
    queryContext: QueryContext
  ): Promise<void> {
    super.$beforeUpdate(options, queryContext)
    if (this.password) {
      this.password = await encryptPassword(this.password)
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
