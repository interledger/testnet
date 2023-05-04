import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

export const paySchema = z.object({
  paymentPointerId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  incomingPaymentUrl: z.string().url().trim(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  description: z.string(),
  isReceive: z.boolean().default(true)
})

export const sendSchema = z.object({
  paymentPointerId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  toPaymentPointerUrl: z.string().url().trim(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  description: z.string(),
  paymentType: z.enum(['sent', 'received'])
})

export const requestSchema = z.object({
  paymentPointerId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  description: z.string()
})

type PayArgs = z.infer<typeof paySchema>
type PayError = ErrorResponse<PayArgs | undefined>
type PayResponse = Promise<SuccessResponse | PayError>

type SendArgs = z.infer<typeof sendSchema>
type SendError = ErrorResponse<SendArgs | undefined>
type SendResponse = Promise<SuccessResponse | SendError>

type Transaction = {
  paymentPointerId: string
  paymentId: string
  assetCode: string
  value: number
  type: string
  status: string
  description?: string
}

type PaymentDetails = {
  description?: string
  value: number
}
type RequestArgs = z.infer<typeof requestSchema>
type RequestResult = SuccessResponse<Transaction>
type RequestError = ErrorResponse<RequestArgs | undefined>
type RequestResponse = Promise<RequestResult | RequestError>

type IncomingPaymentDetailsResult = SuccessResponse<PaymentDetails>
type IncomingPaymentDetailsResponse = Promise<
  IncomingPaymentDetailsResult | ErrorResponse
>

interface TransfersService {
  pay: (args: PayArgs) => Promise<PayResponse>
  send: (args: SendArgs) => Promise<SendResponse>
  request: (args: RequestArgs) => Promise<RequestResponse>
  getIncomingPaymentDetails: (
    incomingPaymentUrl: string
  ) => Promise<IncomingPaymentDetailsResponse>
}

const createTransfersService = (): TransfersService => ({
  async pay(args): Promise<PayResponse> {
    try {
      const response = await httpClient
        .post('outgoing-payments', {
          json: {
            ...args,
            paymentPointerId: args.paymentPointerId
              ? args.paymentPointerId.value
              : undefined
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<PayArgs>(
        error,
        'We could not pay the money. Please try again.'
      )
    }
  },

  async send(args): Promise<SendResponse> {
    try {
      const response = await httpClient
        .post('outgoing-payments', {
          json: {
            paymentPointerId: args.paymentPointerId
              ? args.paymentPointerId.value
              : undefined,
            toPaymentPointerUrl: args.toPaymentPointerUrl,
            amount: args.amount,
            description: args.description,
            isReceive: args.paymentType === 'received'
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<SendArgs>(
        error,
        'We could not send the money. Please try again.'
      )
    }
  },

  async request(args): Promise<RequestResponse> {
    try {
      const response = await httpClient
        .post('incoming-payments', {
          json: {
            ...args,
            paymentPointerId: args.paymentPointerId
              ? args.paymentPointerId.value
              : undefined
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<RequestArgs>(
        error,
        'We could not request the money. Please try again.'
      )
    }
  },

  async getIncomingPaymentDetails(
    incomingPaymentUrl: string
  ): Promise<IncomingPaymentDetailsResponse> {
    try {
      const response = await httpClient
        .get('incoming-payments', {
          json: {
            incomingPaymentUrl: incomingPaymentUrl
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'Something went wrong. Please make sure the url is correct and try again.'
      )
    }
  }
})

export const transfersService = createTransfersService()
