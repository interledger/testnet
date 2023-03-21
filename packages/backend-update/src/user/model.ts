import { Account } from '@/account/model'
import { BaseModel } from '@/shared/model'
import { Session } from '@/session/model'
import { Model, QueryContext } from 'objection'
import { randomBytes } from 'crypto'
import { bcrypt, bcryptVerify } from 'hash-wasm'

export class User extends BaseModel {
  static tableName = 'users'

  private password!: string

  public email!: string
  public lastName?: string
  public firstName?: string
  public address?: string
  public country?: string
  public rapydReferenceId?: string
  public rapydWalletId?: string
  public rapydContactId?: string
  public kycId?: string

  public sessions?: Session[]

  async $beforeInsert(queryContext: QueryContext): Promise<void> {
    super.$beforeInsert(queryContext)
    this.password = await bcrypt({
      password: this.password,
      salt: randomBytes(16),
      costFactor: 10,
      outputType: 'encoded'
    })
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
