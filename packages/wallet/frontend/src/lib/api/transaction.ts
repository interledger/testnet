import {
  ErrorResponse,
  SuccessResponse,
  getError,
  httpClient
} from '../httpClient'

// This is weird ...
// Ref: https://github.com/microsoft/TypeScript/issues/54466
declare global {
  interface URLSearchParams {
    size: number
  }
}

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

export interface Transaction {
  id: string
  paymentId: string
  accountName: string
  paymentPointerUrl?: string
  description: string
  paymentPointerId: string
  assetCode: string
  assetScale: number
  value: string
  type: TransactionType
  status: TransactionStatus
  createdAt: string
  updatedAt: string
}

export type TransactionsPage = {
  results: Transaction[]
  total: number
}

type ListTranscationArgs = {
  filters?: Record<string, string>
  pagination?: Record<string, string>
}
type ListTransactionsResult = SuccessResponse<TransactionsPage>
type ListTransactionsResponse = ListTransactionsResult | ErrorResponse

interface TransactionService {
  list(args?: ListTranscationArgs): Promise<ListTransactionsResponse>
}

export const createTransactionService = (): TransactionService => {
  return {
    async list(args) {
      const params = new URLSearchParams()
      for (const key in args?.filters) {
        if (typeof args?.filters[key] !== 'undefined') {
          params.append(`filter[${key}]`, args?.filters[key].toString())
        }
      }

      for (const key in args?.pagination) {
        if (typeof args?.pagination[key] !== 'undefined') {
          params.append(key, args?.pagination[key].toString())
        }
      }

      try {
        const response = await httpClient
          .get(`transactions${params.size > 0 ? `?${params}` : ``}`, {
            retry: 0
          })
          .json<ListTransactionsResult>()
        return response
      } catch (error) {
        return getError(error, 'Unable to fetch payment pointers.')
      }
    }
  }
}

const transactionService = createTransactionService()
export { transactionService }
