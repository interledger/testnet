import { getError } from '../httpClient'
import { z } from 'zod'
import {
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const createPaymentPointerSchema = z.object({
  accountId: z.string().uuid(),
  paymentPointer: z.string().min(3, {
    message: "Payment pointer's name should be at least 3 characters long"
  }),
  publicName: z.string().min(3, {
    message:
      "Payment pointer's public name should be at least 3 characters long"
  })
})

type PaymentPointer = {
  id: string
  publicName: string
  accountId: string
}

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

interface PaymentPointerService {
  get: (
    accountId: string,
    paymentPointerId: string,
    cookies?: string
  ) => Promise<GetPaymentPointerResponse>
  list: (
    accountId: string,
    cookies?: string
  ) => Promise<ListPaymentPointerResponse>
  create: (
    args: CreatePaymentPointerArgs
  ) => Promise<CreatePaymentPointerResponse>
}

const createPaymentPointerService = (): PaymentPointerService => ({
  async get(
    accountId,
    paymentPointerId,
    cookies
  ): Promise<GetPaymentPointerResponse> {
    try {
      const response = await httpClient
        .get(`accounts/${accountId}/payment-pointers/${paymentPointerId}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
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

  async create(args): Promise<CreatePaymentPointerResponse> {
    try {
      const response = httpClient
        .post(`accounts/${args.accountId}/payment-pointers`, {
          json: {
            paymentPointerName: args.paymentPointer,
            publicName: args.publicName
          }
        })
        .json<CreatePaymentPointerResult>()
      return response
    } catch (error) {
      return getError<CreatePaymentPointerArgs>(
        error,
        'We were not able to create your payment pointer. Please try again.'
      )
    }
  }
})

export const paymentPointerService = createPaymentPointerService()
