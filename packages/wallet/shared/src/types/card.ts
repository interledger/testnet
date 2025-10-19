import { CardTrxTypeEnum } from './transaction'

export type LockReasonCode =
  | 'ClientRequestedLock'
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'

export type BlockReasonCode =
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'
  | 'IssuerRequestIncorrectOpening'
  | 'CardDamagedOrNotWorking'
  | 'UserRequest'
  | 'IssuerRequestCustomerDeceased'
  | 'ProductDoesNotRenew'

export type CardLimitType =
  | 'perTransaction'
  | 'dailyOverall'
  | 'weeklyOverall'
  | 'monthlyOverall'
  | 'dailyAtm'
  | 'dailyEcomm'
  | 'monthlyOpenScheme'
  | 'nonEUPayments'

// Response for fetching card transactions
export interface ICardTransaction {
  id: number
  transactionId: string
  ghResponseCode: string
  cardScheme: number
  type: CardTrxTypeEnum
  createdAt: string
  txStatus: string
  vaultId: number
  cardId: number
  refTransactionId: string
  responseCode: string | null
  transactionAmount: string
  transactionCurrency: string
  billingAmount: string
  billingCurrency: string
  terminalId: string | null
  wallet: number
  transactionDateTime: string
  processDateTime: string | null
  merchantName?: string
  mastercardConversion?: {
    convRate?: string
  }
  transactionClassification?: 'Advice'
}

export interface IPagination {
  pageNumber: number
  pageSize: number
  totalPages: number
  totalRecords: number
}

export interface IGetTransactionsResponse {
  data: ICardTransaction[]
  pagination: IPagination
}

export interface ICardResponse {
  id: string
  status: string
  walletAddress: {
    id: string
    url: string
    publicName: string
    active: boolean
  }
}
