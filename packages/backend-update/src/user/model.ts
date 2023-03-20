import { Account } from '@/account/model'
import { BaseModel } from '@/shared/model'
import { Session } from '@/session/model'
import { Model } from 'objection'

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

  public sessions?: Session[]

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
