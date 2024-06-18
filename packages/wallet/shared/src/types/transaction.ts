const TRANSACTION_TYPE = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING'
} as const
export type TransactionType = keyof typeof TRANSACTION_TYPE

enum TRANSACTION_STATUS {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED'
}
type TransactionStatus = keyof typeof TRANSACTION_STATUS

export interface TransactionResponse {
  id: string
  paymentId: string
  description?: string
  walletAddressId?: string
  assetCode: string
  value: string | null | bigint
  type: TransactionType
  status: TransactionStatus
  createdAt: Date
  updatedAt: Date
}
interface TransactionListResponse extends TransactionResponse {
  assetScale: number
  accountName: string
  walletAddressPublicName?: string
  walletAddressUrl?: string
}

export interface TransactionsPageResponse {
  results: TransactionListResponse[]
  total: number
}
