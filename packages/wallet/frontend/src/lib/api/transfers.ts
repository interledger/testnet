import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { Transaction } from './transaction'

export const sendSchema = z.object({
  paymentPointerId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  receiver: z.string().trim(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  description: z.string(),
  paymentType: z.enum([PAYMENT_SEND, PAYMENT_RECEIVE])
})

export const acceptQuoteSchema = z.object({
  quoteId: z.string().uuid()
})

const TIME_UNITS = ['s', 'm', 'h', 'd'] as const

export type TimeUnit = (typeof TIME_UNITS)[number]

export const requestSchema = z
  .object({
    paymentPointerId: z
      .object({
        value: z.string().uuid(),
        label: z.string().min(1)
      })
      .nullable(),
    amount: z.coerce.number({
      invalid_type_error: 'Please enter a valid amount'
    }),
    description: z.string(),
    expiry: z.coerce
      .number()
      .int({ message: 'Expiry time amount should be a whole number' })
      .refine((value) => {
        if (value && isNaN(value)) {
          return false
        }
        return true
      })
      .refine(
        (value) => {
          if (value && value <= 0) {
            return false
          }
          return true
        },
        { message: 'Expiry time amount should be greater than 0' }
      )
      .optional(),
    unit: z
      .object({
        value: z.enum(TIME_UNITS),
        label: z.string().min(1)
      })
      .optional()
  })
  .superRefine(({ expiry, unit }, ctx) => {
    if ((expiry && !unit) || (!expiry && unit)) {
      ctx.addIssue({
        code: 'custom',
        message:
          'Payment expiry was not properly specified. Please make sure that both the amount and time unit are specified',
        path: ['expiry']
      })
    }
  })

type PaymentDetails = {
  description?: string
  value: number
}

type AmountProps = {
  assetCode: string
  assetScale: number
  value: string
}

interface Expiration {
  value: number
  unit: string
}

export interface Quote {
  id: string
  receiveAmount: AmountProps
  sendAmount: AmountProps
  fee?: AmountProps
}

type SendArgs = z.infer<typeof sendSchema>
type QuoteResult = SuccessResponse<Quote>
type SendError = ErrorResponse<SendArgs | undefined>
type SendResponse = QuoteResult | SendError

type AcceptQuoteArgs = z.infer<typeof acceptQuoteSchema>
type AcceptQuoteError = ErrorResponse<AcceptQuoteArgs | undefined>
type AcceptQuoteResponse = SuccessResponse | AcceptQuoteError

type RequestArgs = z.infer<typeof requestSchema>
type RequestResult = SuccessResponse<Transaction>
type RequestError = ErrorResponse<RequestArgs | undefined>
type RequestResponse = RequestResult | RequestError

type IncomingPaymentDetailsResult = SuccessResponse<PaymentDetails>
type IncomingPaymentDetailsResponse =
  | IncomingPaymentDetailsResult
  | ErrorResponse

interface TransfersService {
  send: (args: SendArgs) => Promise<SendResponse>
  acceptQuote: (args: AcceptQuoteArgs) => Promise<AcceptQuoteResponse>
  request: (args: RequestArgs) => Promise<RequestResponse>
  getIncomingPaymentDetails: (
    incomingPaymentUrl: string
  ) => Promise<IncomingPaymentDetailsResponse>
}

const createTransfersService = (): TransfersService => ({
  async send(args) {
    try {
      const response = await httpClient
        .post('quotes', {
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
        'We could not fetch your quote. Please try again.'
      )
    }
  },

  async acceptQuote(args) {
    try {
      const response = await httpClient
        .post('outgoing-payments', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<AcceptQuoteArgs>(
        error,
        'We could not send the money. Please try again.'
      )
    }
  },

  async request(args) {
    let expiration: Expiration | undefined = undefined
    if (args.expiry && args.expiry > 0 && args.unit) {
      expiration = {
        value: args.expiry,
        unit: args.unit.value
      }
    }

    try {
      const response = await httpClient
        .post('incoming-payments', {
          json: {
            ...args,
            paymentPointerId: args.paymentPointerId
              ? args.paymentPointerId.value
              : undefined,
            expiration
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
