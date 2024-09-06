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

type GetDetailsResponse = SuccessResponse<IUserCard>
type GetDetailsResult = GetDetailsResponse | ErrorResponse

type TerminateCardResult = SuccessResponse<boolean> | ErrorResponse

type FreezeResult = SuccessResponse<boolean> | ErrorResponse

type UnfreezeResult = SuccessResponse<boolean> | ErrorResponse

type UpdateSpendingLimitResult = SuccessResponse | ErrorResponse

type ChangePinResult = SuccessResponse | ErrorResponse

interface UserCardService {
  getDetails(cookies?: string): Promise<GetDetailsResult>
  terminate(): Promise<TerminateCardResult>
  freeze(): Promise<FreezeResult>
  unfreeze(): Promise<UnfreezeResult>
  updateSpendingLimit(): Promise<UpdateSpendingLimitResult>
  changePin(): Promise<ChangePinResult>
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

  async changePin() {
    try {
      const response = await httpClient
        .post('card/change-pin')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
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

  async changePin() {
    try {
      const response = await httpClient
        .post('card/change-pin')
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, '[TODO] UPDATE ME!')
    }
  }
})

const cardService = createCardService()
const cardServiceMock = mock()
export { cardService, cardServiceMock }
