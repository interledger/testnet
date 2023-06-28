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

const PERMISSIONS = {
  CREATE: 'create',
  READ: 'read',
  LIST: 'list',
  COMPLETE: 'complete'
} as const
type Permission = keyof typeof PERMISSIONS

const ACCESS_TYPES = {
  INCOMING_PAYMENT: 'incoming payment',
  OUTGOING_PAYMENT: 'outgoing payment',
  QUOTE: 'quote'
} as const
type AccessType = keyof typeof ACCESS_TYPES

type PaymentAmount = {
  value: number
  assetCode: string
  assetScale: number
  formattedAmount?: string
}
type Access = {
  identifier: string
  actions: Permission[]
  type: AccessType
  limits: {
    receiver: string
    sendAmount: PaymentAmount
    receiveAmount: PaymentAmount
    interval: string
  }
}

export type Grant = {
  id: string
  client: string
  state: GrantState
  createdAt: string
  access: Access[]
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
    try {
      const response = await httpClient
        .get(`grants/${grantId}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetGrantResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch grant details.')
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
