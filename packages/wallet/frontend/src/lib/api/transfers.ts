import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'
import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { PaymentDetailsResponse, QuoteResponse } from '@wallet/shared'

export const sendSchema = z.object({
  walletAddressId: z
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
  paymentType: z.enum([PAYMENT_SEND, PAYMENT_RECEIVE]),
  firstName: z.string().optional(),
  lastName: z.string().optional()
})

export const acceptQuoteSchema = z.object({
  quoteId: z.string().uuid()
})

const TIME_UNITS = ['s', 'm', 'h', 'd'] as const

export type TimeUnit = (typeof TIME_UNITS)[number]

export const requestSchema = z
  .object({
    walletAddressId: z
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

interface Expiration {
  value: number
  unit: string
}

type SendArgs = z.infer<typeof sendSchema>
type QuoteResult = SuccessResponse<QuoteResponse>
type SendError = ErrorResponse<SendArgs | undefined>
type SendResponse = QuoteResult | SendError

type AcceptQuoteArgs = z.infer<typeof acceptQuoteSchema>
type AcceptQuoteError = ErrorResponse<AcceptQuoteArgs | undefined>
type AcceptQuoteResponse = SuccessResponse | AcceptQuoteError

type RequestArgs = z.infer<typeof requestSchema>
type RequestResult = SuccessResponse<{ url: string }>
type RequestError = ErrorResponse<RequestArgs | undefined>
type RequestResponse = RequestResult | RequestError

type IncomingPaymentDetailsResult = SuccessResponse<PaymentDetailsResponse>
type IncomingPaymentDetailsResponse =
  | IncomingPaymentDetailsResult
  | ErrorResponse

type SEPAArgs = { receiver: string; firstName: string; lastName: string }
type SEPAResult = SuccessResponse<{ nonce: string }>
type SEPAResponse = SEPAResult | ErrorResponse

interface TransfersService {
  send: (args: SendArgs) => Promise<SendResponse>
  acceptQuote: (args: AcceptQuoteArgs) => Promise<AcceptQuoteResponse>
  request: (args: RequestArgs) => Promise<RequestResponse>
  getIncomingPaymentDetails: (
    incomingPaymentUrl: string
  ) => Promise<IncomingPaymentDetailsResponse>
  getSEPADetails: (args: SEPAArgs) => Promise<SEPAResponse>
}

const createTransfersService = (): TransfersService => ({
  async send(args) {
    try {
      const response = await httpClient
        .post('quotes', {
          json: {
            walletAddressId: args.walletAddressId
              ? args.walletAddressId.value
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
            walletAddressId: args.walletAddressId
              ? args.walletAddressId.value
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
  },

  async getSEPADetails(args) {
    try {
      const response = await httpClient
        .get('/sepa-transaction', {
          json: {
            ...args
          }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'Something went wrong. Please make sure the data is correct and try again.'
      )
    }
  }
})

export const transfersService = createTransfersService()
