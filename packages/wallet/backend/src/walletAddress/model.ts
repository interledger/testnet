import { Model } from 'objection'
import { Account } from '@/account/model'
import { Transaction } from '@/transaction/model'
import { WalletAddressKeys } from '@/walletAddressKeys/model'
import { BaseModel } from '@shared/backend'
import { IWalletAddressResponse } from '@wallet/shared/src'
import { Card } from '@/interledgerCard/model'

export class WalletAddress extends BaseModel implements IWalletAddressResponse {
  static tableName = 'walletAddresses'

  publicName!: string
  readonly id!: string
  readonly url!: string
  readonly accountId!: string
  active!: boolean
  isCard?: boolean
  account!: Account
  transactions!: Array<Transaction>
  card!: Card

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
    },

    keys: {
      relation: Model.HasManyRelation,
      modelClass: WalletAddressKeys,
      join: {
        from: 'walletAddresses.id',
        to: 'walletAddressKeys.walletAddressId'
      }
    },

    card: {
      relation: Model.HasOneRelation,
      modelClass: Card,
      join: {
        from: 'walletAddresses.id',
        to: 'cards.walletAddressId'
      }
    }
  })
}
