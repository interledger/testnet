import { WalletAddress } from '@/walletAddress/model'
import { User } from '@/user/model'
import { Model } from 'objection'
import { BaseModel } from '@shared/backend'

export class Account extends BaseModel {
  static tableName = 'accounts'

  public name!: string
  public balance!: bigint
  public gateHubWalletId!: string
  public readonly assetId!: string
  public readonly assetCode!: string
  public readonly assetScale!: number
  public readonly userId!: string
  public user!: User
  public walletAddresses!: Array<WalletAddress>
  public cardId?: string
  public isFunded!: boolean

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: User,
      join: {
        from: 'accounts.userId',
        to: 'users.id'
      }
    },
    walletAddresses: {
      relation: Model.HasManyRelation,
      modelClass: WalletAddress,
      join: {
        from: 'accounts.id',
        to: 'walletAddresses.accountId'
      }
    }
  })
}
