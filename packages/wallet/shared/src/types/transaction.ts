const TRANSACTION_TYPE = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING'
} as const
export type TransactionType = keyof typeof TRANSACTION_TYPE

const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  EXPIRED: 'EXPIRED',
  FAILED: 'FAILED'
} as const
type TransactionStatus = keyof typeof TRANSACTION_STATUS

export interface TransactionResponse {
  id: string
  paymentId: string
  walletAddressPublicName?: string
  walletAddressUrl?: string
  description?: string
  walletAddressId?: string
  assetCode: string
  value: string | null | bigint
  type: TransactionType
  status: TransactionStatus
}
interface TransactionListResponse extends TransactionResponse {
  assetScale: number
  accountName: string
  createdAt: string
  updatedAt: string
}

export interface TransactionsPageResponse {
  results: TransactionListResponse[]
  total: number
}
