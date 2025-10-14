import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { ICardResponse } from '@wallet/shared'

export const changePinSchema = z
  .object({
    pin: z.string().length(4),
    confirmPin: z.string()
  })
  .superRefine(({ pin, confirmPin }, ctx) => {
    const hasOnlyDigits = /^\d+$/.test(pin)

    if (!hasOnlyDigits) {
      ctx.addIssue({
        code: 'custom',
        message: 'The PIN should only contain digits.',
        path: ['pin']
      })

      return
    }

    if (pin !== confirmPin) {
      ctx.addIssue({
        code: 'custom',
        message: 'PINs do not match.',
        path: ['pin']
      })
    }
  })

export const dailySpendingLimitSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive()
})

export const monthlySpendingLimitSchema = z.object({
  amount: z.coerce
    .number({
      invalid_type_error: 'Please enter a valid amount'
    })
    .positive()
})

export const terminateCardSchema = z.object({
  password: z.string().min(1),
  reason: z
    .object({
      value: z.string(),
      label: z.string().min(1)
    })
    .nullable()
})

type GetDetailsResponse = SuccessResponse<ICardResponse[]>
type GetDetailsResult = GetDetailsResponse | ErrorResponse

type TerminateCardResult = SuccessResponse<boolean> | ErrorResponse

type FreezeResult = SuccessResponse | ErrorResponse

type UnfreezeResult = SuccessResponse<boolean> | ErrorResponse

type ChangePinArgs = z.infer<typeof changePinSchema>
type ChangePinError = ErrorResponse<ChangePinArgs | undefined>
type ChangePinResult = SuccessResponse | ChangePinError

type DailySpendingLimitArgs = z.infer<typeof dailySpendingLimitSchema>
type DailySpendingLimitError = ErrorResponse<DailySpendingLimitArgs | undefined>
type DailySpendingLimitResult = SuccessResponse | DailySpendingLimitError

type MonthlySpendingLimitArgs = z.infer<typeof monthlySpendingLimitSchema>
type MonthlySpendingLimitError = ErrorResponse<
  MonthlySpendingLimitArgs | undefined
>
type MonthlySpendingLimitResult = SuccessResponse | MonthlySpendingLimitError

const getCardDataSchema = z.object({
  password: z.string(),
  publicKeyBase64: z.string()
})

export const orderCardsSchema = z.object({
  walletAddressId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable(),
  accountId: z
    .object({
      value: z.string().uuid(),
      label: z.string().min(1)
    })
    .nullable()
})

type GetCardDataArgs = z.infer<typeof getCardDataSchema>
type GetCardDataError = ErrorResponse<GetCardDataArgs | undefined>
type GetCardDataResponse = SuccessResponse<{ cypher: string }>
type GetCardDataResult = GetCardDataResponse | GetCardDataError
type OrderCardResponse = {
  publicKey: string
  privateKey: string
}

interface UserCardService {
  orderCard(args: {
    walletAddressId: string
    accountId: string
  }): Promise<SuccessResponse<OrderCardResponse> | ErrorResponse>
  getDetails(cookies?: string): Promise<GetDetailsResult>
  getCardData(cardId: string, args: GetCardDataArgs): Promise<GetCardDataResult>
  terminate(cardId: string): Promise<TerminateCardResult>
  freeze(cardId: string): Promise<FreezeResult>
  unfreeze(cardId: string): Promise<UnfreezeResult>
  getPin(
    cardId: string,
    args: { password: string; publicKeyBase64: string }
  ): Promise<SuccessResponse<{ cypher: string }> | ErrorResponse>
  changePin(
    cardId: string,
    args: { token: string; cypher: string }
  ): Promise<ChangePinResult>
  getChangePinToken(
    cardId: string
  ): Promise<SuccessResponse<string> | ErrorResponse>
  setDailySpendingLimit(
    args: DailySpendingLimitArgs
  ): Promise<DailySpendingLimitResult>
  setMonthlySpendingLimit(
    args: MonthlySpendingLimitArgs
  ): Promise<MonthlySpendingLimitResult>
}

const createCardService = (): UserCardService => ({
  async orderCard(args) {
    try {
      const response = await httpClient
        .post(`cards`, {
          json: {
            accountId: args.accountId,
            walletAddressId: args.walletAddressId
          }
        })
        .json<SuccessResponse<OrderCardResponse>>()
      return response
    } catch (error) {
      return getError(error, 'We could not order a new card. Please try again.')
    }
  },

  async getPin(cardId, args) {
    try {
      const response = await httpClient
        .post(
          `cards/${cardId}/pin?publicKeyBase64=${encodeURIComponent(args.publicKeyBase64)}`,
          {
            json: { password: args.password }
          }
        )
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async getChangePinToken(cardId) {
    try {
      const response = await httpClient
        .get(`cards/${cardId}/change-pin-token`)
        .json<SuccessResponse<string>>()
      return response
    } catch (error) {
      return getError(
        error,
        'The request to change the card PIN has failed. Please try again.'
      )
    }
  },

  async getDetails(cookies) {
    try {
      const response = await httpClient
        .get(`cards`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetDetailsResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async getCardData(cardId, args) {
    try {
      const response = await httpClient
        .post(
          `cards/${cardId}/details?publicKeyBase64=${encodeURIComponent(args.publicKeyBase64)}`,
          { json: { password: args.password } }
        )
        .json<GetCardDataResponse>()
      return response
    } catch (error) {
      return getError<GetCardDataArgs>(error, 'Could not retrieve card details')
    }
  },

  async terminate(cardId) {
    try {
      const response = await httpClient
        .delete(`cards/${cardId}/terminate`, {
          json: {}
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, 'Could not terminate card. Please try again.')
    }
  },

  async freeze(cardId) {
    try {
      const response = await httpClient
        .put(`cards/${cardId}/freeze`, {
          json: { note: 'User request' }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, 'Could not freeze card. Please try again')
    }
  },

  async unfreeze(cardId: string) {
    try {
      const response = await httpClient
        .put(`cards/${cardId}/unfreeze`, {
          json: { note: 'User request' }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, 'Could not unfreeze card. Please try again.')
    }
  },

  async changePin(cardId, args) {
    try {
      const response = await httpClient
        .post(`cards/${cardId}/change-pin`, {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<ChangePinArgs>(error, '[TODO] UPDATE ME!')
    }
  },

  async setDailySpendingLimit(args) {
    try {
      const response = await httpClient
        .post('card/spending-limit/daily', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<DailySpendingLimitArgs>(error, '[TODO] UPDATE ME!')
    }
  },

  async setMonthlySpendingLimit(args) {
    try {
      const response = await httpClient
        .post('card/spending-limit/monthly', {
          json: args
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError<MonthlySpendingLimitArgs>(error, '[TODO] UPDATE ME!')
    }
  }
})

const cardService = createCardService()
export { cardService }
