const TRANSACTION_TYPE = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING'
} as const
export type TransactionType = keyof typeof TRANSACTION_TYPE

const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
} as const
type TransactionStatus = keyof typeof TRANSACTION_STATUS

export interface TransactionResponse {
  id: string
  paymentId: string
  accountName: string
  walletAddressPublicName?: string
  walletAddressUrl?: string
  description: string
  walletAddressId: string
  assetCode: string
  assetScale: number
  value: string
  type: TransactionType
  status: TransactionStatus
  createdAt: string
  updatedAt: string
}

export interface TransactionsPageResponse {
  results: TransactionResponse[]
  total: number
}
