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

const FREEZE_REASON = 'ClientRequestedLock'

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
  publicKeyBase64: z.string()
})

type GetCardDataArgs = z.infer<typeof getCardDataSchema>
type GetCardDataError = ErrorResponse<GetCardDataArgs | undefined>
type GetCardDataResponse = SuccessResponse<{ cypher: string }>
type GetCardDataResult = GetCardDataResponse | GetCardDataError

interface UserCardService {
  getDetails(cookies?: string): Promise<GetDetailsResult>
  getCardData(cardId: string, args: GetCardDataArgs): Promise<GetCardDataResult>
  terminate(): Promise<TerminateCardResult>
  freeze(cardId: string): Promise<FreezeResult>
  unfreeze(cardId: string): Promise<UnfreezeResult>
  changePin(cardId: string, args: ChangePinArgs): Promise<ChangePinResult>
  setDailySpendingLimit(
    args: DailySpendingLimitArgs
  ): Promise<DailySpendingLimitResult>
  setMonthlySpendingLimit(
    args: MonthlySpendingLimitArgs
  ): Promise<MonthlySpendingLimitResult>
}

const createCardService = (): UserCardService => ({
  async getDetails(cookies) {
    try {
      const response = await httpClient
        .get(`customers/cards`, {
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
        .get(
          `cards/${cardId}/details?publicKeyBase64=${encodeURIComponent(args.publicKeyBase64)}`
        )
        .json<GetCardDataResponse>()
      return response
    } catch (error) {
      return getError<GetCardDataArgs>(error, 'Could not retrieve card details')
    }
  },

  async terminate() {
    try {
      const response = await httpClient
        .post('card/terminate')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async freeze(cardId) {
    try {
      const response = await httpClient
        .put(`cards/${cardId}/lock?reasonCode=${FREEZE_REASON}`, {
          json: { note: 'User request' }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, 'Could not freeze card. Please try again!')
    }
  },

  async unfreeze(cardId: string) {
    try {
      const response = await httpClient
        .put(`cards/${cardId}/unlock`, {
          json: { note: 'User request' }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async changePin(args) {
    try {
      const response = await httpClient
        .post('card/change-pin', {
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

const mock = (service: UserCardService): UserCardService => {
  return {
    ...service,

    async terminate() {
      return Promise.resolve({
        success: true,
        message: 'Mocked terminate',
        result: true
      })
    },

    async unfreeze() {
      return Promise.resolve({
        success: true,
        message: 'Mocked unfreeze',
        result: true
      })
    }
  }
}

const cardService = createCardService()
const cardServiceMock = mock(cardService)
export { cardService, cardServiceMock }
