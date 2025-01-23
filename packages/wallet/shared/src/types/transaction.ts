enum TRANSACTION_TYPE {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING'
}
export type TransactionType = keyof typeof TRANSACTION_TYPE

enum TRANSACTION_STATUS {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
  FAILED = 'FAILED'
}
type TransactionStatus = keyof typeof TRANSACTION_STATUS

export enum CardTrxTypeEnum {
  Purchase = 0,
  ATMWithdrawal = 1,
  CardVerificationInquiry = 6,
  CashAdvance = 17,
  RefundCreditPayment = 20,
  BalanceInquiryOnATM = 30,
  PINUnblock = 91,
  PINChange = 92,
  Preauthorization = 101,
  PreauthorizationIncremental = 102,
  PreauthorizationCompletion = 103,
  TransferToAccount = 107,
  TransferFromAccount = 108
}

export interface TransactionResponse {
  id: string
  paymentId: string
  description?: string
  walletAddressId?: string
  assetCode: string
  value: string | null | bigint
  type: TransactionType
  status: TransactionStatus
  // Merchant name for card transactions
  // Receiver or sender WA for ilp payments
  secondParty?: string
  txAmount?: bigint
  txCurrency?: string
  conversionRate?: string
  cardTxType?: CardTrxTypeEnum
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
