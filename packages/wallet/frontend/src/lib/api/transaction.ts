import { z } from 'zod'
import {
  ErrorResponse,
  SuccessResponse,
  getError,
  httpClient
} from '../httpClient'

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

export type TransactionsPage = {
  results: Transaction[]
  total: number
}

export const transactionListQuerySchema = z.object({
  accountId: z.string().uuid().optional(),
  walletAddressId: z.string().uuid().optional(),
  assetCode: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  page: z.coerce.number().int().nonnegative().default(0).optional(),
  pageSize: z.coerce.number().int().positive().default(10).optional(),
  orderByDate: z.enum(['ASC', 'DESC']).default('DESC').optional()
})

type ListTransactionArgs = {
  filters?: Record<string, string>
  pagination?: Record<string, string>
}
type ListTransactionsResult = SuccessResponse<TransactionsPage>
type ListTransactionsResponse = ListTransactionsResult | ErrorResponse

interface TransactionService {
  list(args?: ListTransactionArgs): Promise<ListTransactionsResponse>
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
          .get(`transactions?${params}`, {
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
