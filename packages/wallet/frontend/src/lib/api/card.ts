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

type GetDetailsResponse = SuccessResponse<ICardResponse>
type GetDetailsResult = GetDetailsResponse | ErrorResponse

type TerminateCardResult = SuccessResponse<boolean> | ErrorResponse

type FreezeResult = SuccessResponse<boolean> | ErrorResponse

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

interface UserCardService {
  getDetails(cookies?: string): Promise<GetDetailsResult>
  terminate(): Promise<TerminateCardResult>
  freeze(cardId: string): Promise<FreezeResult>
  unfreeze(cardId: string): Promise<UnfreezeResult>
  changePin(args: ChangePinArgs): Promise<ChangePinResult>
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
        .get(`customer/card`, {
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
        .put(`cards/${cardId}/lock`)
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'An error occured while freezing the card. Please try again.'
      )
    }
  },

  async unfreeze(cardId) {
    try {
      const response = await httpClient
        .put(`cards/${cardId}/unlock`)
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'An error occured while unfreezing the card. Please try again.'
      )
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
    // @ts-expect-error: we know - will be removed
    async getDetails() {
      return Promise.resolve({
        success: true,
        message: 'Mocked getDetails',
        result: {
          name: 'John Doe',
          number: '4242 4242 4242 4242',
          expiry: '01/27',
          cvv: 321,
          isFrozen: Math.random() > 0.5 ? true : false
        }
      })
    },

    async terminate() {
      return Promise.resolve({
        success: true,
        message: 'Mocked terminate',
        result: true
      })
    },

    async freeze() {
      return Promise.resolve({
        success: true,
        message: 'Mocked freeze',
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
