import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { Transaction } from './paymentPointer'

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

export const merged = z.object({
  paymentPointerId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  receiver: z.string().url().trim(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  description: z.string(),
  paymentType: z.enum([PAYMENT_SEND, PAYMENT_RECEIVE])
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
  paymentType: z.enum([PAYMENT_SEND, PAYMENT_RECEIVE])
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

type PaymentDetails = {
  description?: string
  value: number
}

type PayArgs = z.infer<typeof paySchema>
type PayError = ErrorResponse<PayArgs | undefined>
type PayResponse = SuccessResponse | PayError

type SendArgs = z.infer<typeof merged>
type SendError = ErrorResponse<SendArgs | undefined>
type SendResponse = SuccessResponse | SendError

type RequestArgs = z.infer<typeof requestSchema>
type RequestResult = SuccessResponse<Transaction>
type RequestError = ErrorResponse<RequestArgs | undefined>
type RequestResponse = RequestResult | RequestError

type IncomingPaymentDetailsResult = SuccessResponse<PaymentDetails>
type IncomingPaymentDetailsResponse =
  | IncomingPaymentDetailsResult
  | ErrorResponse

interface TransfersService {
  pay: (args: PayArgs) => Promise<PayResponse>
  send: (args: SendArgs) => Promise<SendResponse>
  request: (args: RequestArgs) => Promise<RequestResponse>
  getIncomingPaymentDetails: (
    incomingPaymentUrl: string
  ) => Promise<IncomingPaymentDetailsResponse>
}

const createTransfersService = (): TransfersService => ({
  async pay(args) {
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

  async send(args) {
    try {
      const response = await httpClient
        .post('outgoing-payments', {
          json: {
            paymentPointerId: args.paymentPointerId
              ? args.paymentPointerId.value
              : undefined,
            receiver: args.receiver,
            amount: args.amount,
            description: args.description,
            isReceive: args.paymentType === PAYMENT_RECEIVE
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

  async request(args) {
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

  async getIncomingPaymentDetails(incomingPaymentUrl) {
    try {
      const response = await httpClient
        .get('payment-details', {
          searchParams: {
            url: incomingPaymentUrl
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
