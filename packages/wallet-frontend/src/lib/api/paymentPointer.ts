import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const createPaymentPointerSchema = z.object({
  paymentPointerName: z.string().toLowerCase().min(3, {
    message:
      'The name of the payment pointer should be at least 3 characters long'
  }),
  publicName: z.string().min(3, {
    message:
      'The public name of the payment pointer should be at least 3 characters long'
  })
})

const TRANSACTION_TYPE = {
  INCOMING: 'INCOMING',
  OUTGOING: 'OUTGOING'
} as const
type TransactionType = keyof typeof TRANSACTION_TYPE

const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED'
} as const
type TransactionStatus = keyof typeof TRANSACTION_STATUS
interface Transaction {
  id: string
  paymentId: string
  description: string
  paymentPointerId: string
  assetCode: string
  value: string
  type: TransactionType
  status: TransactionStatus
  createdAt: string
  updatedAt: string
}

export type PaymentPointer = {
  id: string
  url: string
  publicName: string
  accountId: string
  transactions: Transaction[]
}

type GetPaymentPointerArgs = { accountId: string; paymentPointerId: string }
type GetPaymentPointerResult = SuccessResponse<PaymentPointer>
type GetPaymentPointerResponse = GetPaymentPointerResult | ErrorResponse

type ListPaymentPointerResult = SuccessResponse<PaymentPointer[]>
type ListPaymentPointerResponse = ListPaymentPointerResult | ErrorResponse

type CreatePaymentPointerArgs = z.infer<typeof createPaymentPointerSchema>
type CreatePaymentPointerResult = SuccessResponse<PaymentPointer>
type CreatePaymentPointerError = ErrorResponse<
  CreatePaymentPointerArgs | undefined
>
type CreatePaymentPointerResponse =
  | CreatePaymentPointerResult
  | CreatePaymentPointerError

type DeletePaymentPointerResponse = SuccessResponse | ErrorResponse

interface PaymentPointerService {
  get: (
    args: GetPaymentPointerArgs,
    cookies?: string
  ) => Promise<GetPaymentPointerResponse>
  list: (
    accountId: string,
    cookies?: string
  ) => Promise<ListPaymentPointerResponse>
  create: (
    accountId: string,
    args: CreatePaymentPointerArgs
  ) => Promise<CreatePaymentPointerResponse>
  delete: (paymentPointerId: string) => Promise<DeletePaymentPointerResponse>
}

const createPaymentPointerService = (): PaymentPointerService => ({
  async get(args, cookies) {
    try {
      const response = await httpClient
        .get(
          `accounts/${args.accountId}/payment-pointers/${args.paymentPointerId}`,
          {
            headers: {
              ...(cookies ? { Cookie: cookies } : {})
            }
          }
        )
        .json<GetPaymentPointerResult>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to fetch information about the payment pointer. Please try again.'
      )
    }
  },

  async list(accountId, cookies): Promise<ListPaymentPointerResponse> {
    try {
      const response = await httpClient
        .get(`accounts/${accountId}/payment-pointers`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListPaymentPointerResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch payment pointers.')
    }
  },

  async create(accountId, args): Promise<CreatePaymentPointerResponse> {
    try {
      const response = await httpClient
        .post(`accounts/${accountId}/payment-pointers`, {
          json: args
        })
        .json<CreatePaymentPointerResult>()
      return response
    } catch (error) {
      return getError<CreatePaymentPointerArgs>(
        error,
        'We were not able to create your payment pointer. Please try again.'
      )
    }
  },

  async delete(
    paymentPointerId: string
  ): Promise<DeletePaymentPointerResponse> {
    try {
      const response = await httpClient
        .delete(`payment-pointer/${paymentPointerId}`)
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to delete your payment pointer. Please try again.'
      )
    }
  }
})

export const paymentPointerService = createPaymentPointerService()
