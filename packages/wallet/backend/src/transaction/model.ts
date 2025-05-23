import { Model } from 'objection'
import { WalletAddress } from '@/walletAddress/model'
import { Account } from '@/account/model'
import { BaseModel } from '@shared/backend'
import { TransactionResponse } from '@wallet/shared'

export type TransactionType = 'INCOMING' | 'OUTGOING'
export type TransactionSource = 'Interledger' | 'Stripe' | 'Card'
export type TransactionExtended = Transaction & {
  walletAddressUrl: WalletAddress['url']
  accountName: Account['name']
}

export class TransactionBaseModel extends BaseModel {
  paymentId!: string
  value!: bigint | null
  type!: TransactionType
  status!: 'PENDING' | 'COMPLETED' | 'EXPIRED' | 'FAILED'
  deletedAt!: Date | null
  expiresAt!: Date | null
}

export class Transaction
  extends TransactionBaseModel
  implements TransactionResponse
{
  static tableName = 'transactions'

  description?: string
  walletAddressId?: string
  accountId!: string
  assetCode!: string
  value!: bigint | null
  walletAddress!: WalletAddress
  source!: TransactionSource
  txAmount?: bigint
  txCurrency?: string
  conversionRate?: string
  cardTxType?: number

  // Merchant name for card transactions
  // Receiver or sender first + last name for ilp payments
  secondParty?: string
  // Receiver wallet address for ilp payments
  secondPartyWA?: string

  static relationMappings = () => ({
    walletAddress: {
      relation: Model.BelongsToOneRelation,
      modelClass: WalletAddress,
      join: {
        from: 'transactions.walletAddressId',
        to: 'walletAddresses.id'
      }
    },
    account: {
      relation: Model.BelongsToOneRelation,
      modelClass: Account,
      join: {
        from: 'transactions.accountId',
        to: 'accounts.id'
      }
    }
  })
}
