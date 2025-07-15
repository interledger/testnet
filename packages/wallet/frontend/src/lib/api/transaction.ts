import { z } from 'zod'
import {
  ErrorResponse,
  SuccessResponse,
  getError,
  httpClient
} from '../httpClient'
import { TransactionsPageResponse } from '@wallet/shared'

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
  filters?: Record<string, string | number>
  pagination?: Record<string, string | number>
}
type ListTransactionsResult = SuccessResponse<TransactionsPageResponse>
type ListTransactionsResponse = ListTransactionsResult | ErrorResponse

interface TransactionService {
  list(args?: ListTransactionArgs): Promise<ListTransactionsResponse>
}

export const createTransactionService = (): TransactionService => {
  return {
    async list(args) {
      const searchParams = new URLSearchParams()
      for (const key in args?.filters) {
        if (typeof args?.filters[key] !== 'undefined') {
          searchParams.append(`filter[${key}]`, args?.filters[key].toString())
        }
      }

      for (const key in args?.pagination) {
        if (typeof args?.pagination[key] !== 'undefined') {
          searchParams.append(key, args?.pagination[key].toString())
        }
      }

      try {
        const response = await httpClient
          .get('transactions', {
            searchParams,
            retry: 0
          })
          .json<ListTransactionsResult>()
        return response
      } catch (error) {
        return getError(error, 'Unable to fetch wallet addresses.')
      }
    }
  }
}

const transactionService = createTransactionService()
export { transactionService }
