import { Model } from 'objection'
import { WalletAddress } from '@/walletAddress/model'
import { BaseModel } from '@shared/backend'

export class WalletAddressKeys extends BaseModel {
  static tableName = 'walletAddressKeys'

  nickname!: string
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
