import { WalletAddress } from '@/walletAddress/model'
import { BaseModel } from '@/shared/model'
import { User } from '@/user/model'
import { Model } from 'objection'

export class Account extends BaseModel {
  static tableName = 'accounts'

  public name!: string
  public balance!: bigint
  public virtualAccountId!: string
  public readonly assetId!: string
  public readonly assetCode!: string
  public readonly assetScale!: number
  public readonly userId!: string
  public user!: User
  public walletAddresses!: Array<WalletAddress>
  public debt!: number

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
