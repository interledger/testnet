import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

// TODO: update interface - can be moved to shared folder as well
export interface IUserCard {
  name: string
  number: string
  expiry: string
  cvv: number
  isFrozen: boolean
}

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

type GetDetailsResponse = SuccessResponse<IUserCard>
type GetDetailsResult = GetDetailsResponse | ErrorResponse

type TerminateCardResult = SuccessResponse<boolean> | ErrorResponse

type FreezeResult = SuccessResponse<boolean> | ErrorResponse

type UnfreezeResult = SuccessResponse<boolean> | ErrorResponse

type UpdateSpendingLimitResult = SuccessResponse | ErrorResponse

type ChangePinArgs = z.infer<typeof changePinSchema>
type ChangePinError = ErrorResponse<ChangePinArgs | undefined>
type ChangePinResponse = SuccessResponse | ChangePinError

// type RequestArgs = z.infer<typeof requestSchema>
// type RequestResult = SuccessResponse<{ url: string }>
// type RequestError = ErrorResponse<RequestArgs | undefined>
// type RequestResponse = RequestResult | RequestError

interface UserCardService {
  getDetails(cookies?: string): Promise<GetDetailsResult>
  terminate(): Promise<TerminateCardResult>
  freeze(): Promise<FreezeResult>
  unfreeze(): Promise<UnfreezeResult>
  updateSpendingLimit(): Promise<UpdateSpendingLimitResult>
  changePin(args: ChangePinArgs): Promise<ChangePinResponse>
}

const createCardService = (): UserCardService => ({
  async getDetails(cookies) {
    try {
      const response = await httpClient
        .get(`card`, {
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

  async freeze() {
    try {
      const response = await httpClient
        .post('card/freeze')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async unfreeze() {
    try {
      const response = await httpClient
        .post('card/unfreeze')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async updateSpendingLimit() {
    try {
      const response = await httpClient
        .post('card/update-spending-limit')
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
  }
})

const mock = (): UserCardService => ({
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
  },

  async updateSpendingLimit() {
    try {
      const response = await httpClient
        .post('card/update-spending-limit')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  },

  async changePin(args: ChangePinArgs) {
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
  }
})

const cardService = createCardService()
const cardServiceMock = mock()
export { cardService, cardServiceMock }
