import { Model } from 'objection'
import { BaseModel } from '@/shared/model'
import { Account } from '@/account/model'
import { Transaction } from '@/transaction/model'

interface WalletAddressKey {
  id: string
  rafikiId: string
  publicKey: string
  createdOn: Date
}

export class WalletAddress extends BaseModel {
  static tableName = 'walletAddresses'

  publicName!: string
  readonly id!: string
  readonly url!: string
  readonly accountId!: string
  isWM!: boolean
  assetCode!: string | null
  assetScale!: number | null
  incomingBalance!: bigint
  outgoingBalance!: bigint
  active!: boolean
  account!: Account
  transactions!: Array<Transaction>
  keyIds!: WalletAddressKey | null

  static relationMappings = () => ({
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'walletAddresses.accountId',
        to: 'accounts.id'
      }
    },

    transactions: {
      relation: Model.HasManyRelation,
      modelClass: Transaction,
      join: {
        from: 'walletAddresses.id',
        to: 'transactions.walletAddressId'
      }
    }
  })
}
