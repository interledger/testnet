import { TransactionBaseModel } from '@/transaction/model'
import { Model } from 'objection'
import { WalletAddress } from '@/walletAddress/model'

export class WMTransaction extends TransactionBaseModel {
  static tableName = 'wmTransactions'

  walletAddressId!: string
  walletAddress!: WalletAddress

  static relationMappings = () => ({
    wmWalletAddress: {
      relation: Model.BelongsToOneRelation,
      modelClass: WalletAddress,
      join: {
        from: 'wmTransactions.walletAddressId',
        to: 'walletAddresses.id'
      }
    }
  })
}
