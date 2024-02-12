import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { WalletAddress } from '@/walletAddress/model'

export class WalletAddressKeys extends BaseModel {
  static tableName = 'walletAddressKeys'

  nickname?: string
  readonly walletAddressId!: string
  readonly rafikiId!: string
  readonly publicKey!: string

  static relationMappings = () => ({
    walletAddress: {
      relation: Model.BelongsToOneRelation,
      modelClass: WalletAddress,
      join: {
        from: 'walletAddressesKey.walletAddressId',
        to: 'walletAddress.id'
      }
    }
  })
}
