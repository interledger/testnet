import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'

const GRANT_STATE = {
  PENDING: 'PENDING',
  GRANTED: 'GRANTED',
  REJECTED: 'REJECTED',
  REVOKED: 'REVOKED'
} as const
type GrantState = keyof typeof GRANT_STATE
export type Grant = {
  id: string
  client: string
  state: GrantState
  createdAt: string
  access: { identifier: string }
}

type ListGrantsResult = SuccessResponse<Grant[]>
type ListGrantsResponse = ListGrantsResult | ErrorResponse

type GetGrantResult = SuccessResponse<Grant>
type GetGrantResponse = GetGrantResult | ErrorResponse

type DeleteGrantResponse = SuccessResponse | ErrorResponse

interface GrantsService {
  list: (cookies?: string) => Promise<ListGrantsResponse>
  get: (grantId: string, cookies?: string) => Promise<GetGrantResponse>
  delete: (grantId: string) => Promise<DeleteGrantResponse>
}

const createGrantsService = (): GrantsService => ({
  async list(cookies) {
    try {
      const response = await httpClient
        .get('grants', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<ListGrantsResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch grants list.')
    }
  },

  async get(grantId, cookies) {
    return {
      success: true,
      message: 'kukac',
      data: {
        id: '8e676506-f787-404b-9400-7dde1a2c8eb1',
        client: 'https://happy-life-bank-backend/accounts/pfry',
        state: 'GRANTED',
        createdAt: '2023-06-14T10:35:08.542Z',
        access: {
          identifier: 'https://cloud-nine-wallet-backend/accounts/gfranklin'
        }
      }
    }
  },

  async delete(grantId: string): Promise<DeleteGrantResponse> {
    try {
      const response = await httpClient
        .delete(`grants/${grantId}`)
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(
        error,
        'We were not able to revoke the grant. Please try again.'
      )
    }
  }
})

const grantsService = createGrantsService()
export { grantsService }
