import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { GrantResponse } from '@wallet/shared'

type GrantNode = {
  cursor: string
  node: GrantResponse
}

export type GrantsPageInfo = {
  endCursor: string
  startCursor: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type GrantsList = {
  grants: {
    edges: GrantNode[]
    pageInfo: GrantsPageInfo
  }
}

export type GrantLocation = {
  grant: GrantResponse
  oneClick: boolean
}

export const grantsListSchema = z.object({
  after: z.string().optional(),
  before: z.string().optional(),
  first: z.coerce.number().int().nonnegative().optional(),
  last: z.coerce.number().int().nonnegative().optional()
})

export type GrantListArgs = z.infer<typeof grantsListSchema>
type GrantsListResult = SuccessResponse<GrantsList>
type GrantsListResponse = GrantsListResult | ErrorResponse

type ListGrantsResult = SuccessResponse<GrantResponse[]>
type ListGrantsResponse = ListGrantsResult | ErrorResponse

type GetGrantResult = SuccessResponse<GrantLocation>
type GetGrantResponse = GetGrantResult | ErrorResponse
type DeleteGrantResponse = SuccessResponse | ErrorResponse

type FinalizeInteractionParams = {
  interactionId: string
  nonce: string
  action: string
}
type FinalizeInteractionResponse = SuccessResponse | ErrorResponse

interface GrantsService {
  list: (args?: GrantListArgs, cookies?: string) => Promise<GrantsListResponse>
  listAll: (cookies?: string) => Promise<ListGrantsResponse>
  get: (grantId: string, cookies?: string) => Promise<GetGrantResponse>
  getInteraction: (
    interactionId: string,
    nonce: string,
    clientName: string,
    cookies?: string
  ) => Promise<GetGrantResponse>
  finalizeInteraction: (
    args: FinalizeInteractionParams
  ) => Promise<FinalizeInteractionResponse>
  delete: (grantId: string) => Promise<DeleteGrantResponse>
}

const createGrantsService = (): GrantsService => ({
  async list(args, cookies) {
    try {
      const response = await httpClient
        .post('list-grants', {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          },
          body: JSON.stringify(args)
        })
        .json<GrantsListResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch grants list.')
    }
  },

  async listAll(cookies) {
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

  async getInteraction(interactionId, nonce, clientName, cookies) {
    try {
      const response = await httpClient
        .get(`grant-interactions/${interactionId}/${nonce}/${clientName}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetGrantResult>()
      return response
    } catch (error) {
      return getError(error, 'Unable to fetch grant request details.')
    }
  },

  async finalizeInteraction(args) {
    try {
      const response = await httpClient
        .patch(`grant-interactions/${args.interactionId}/${args.nonce}`, {
          json: { response: args.action }
        })
        .json<SuccessResponse>()
      return response
    } catch (error) {
      return getError(error, `Unable to ${args.action} grant request.`)
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
