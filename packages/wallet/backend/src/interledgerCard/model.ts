import { WalletAddress } from '@/walletAddress/model'
import { User } from '@/user/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend'
import { Account } from '@/account/model'

export type CardStatusType =
  | 'ORDERED'
  | 'INACTIVE'
  | 'ACTIVE'
  | 'FROZEN'
  | 'TERMINATED'

export class Card extends BaseModel {
  static tableName = 'cards'

  public readonly accountId!: string
  public readonly userId!: string
  public readonly walletAddressId!: string
  public readonly publicKey?: string | null
  public readonly status!: CardStatusType

  public user!: User
  public account!: Account
  public walletAddress!: WalletAddress

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'cards.userId',
        to: 'users.id'
      }
    },
    walletAddress: {
      relation: Model.BelongsToOneRelation,
      modelClass: WalletAddress,
      join: {
        from: 'cards.walletAddressId',
        to: 'walletAddresses.id'
      }
    },
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'cards.accountId',
        to: 'account.id'
      }
    }
  })
}
