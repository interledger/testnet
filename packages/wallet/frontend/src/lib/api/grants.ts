import { z } from 'zod'
import {
  getError,
  httpClient,
  type ErrorResponse,
  type SuccessResponse
} from '../httpClient'
import { GrantResponse, GrantsListResponse } from '@wallet/shared'

export const grantStates = [
  'PROCESSING',
  'PENDING',
  'APPROVED',
  'ISSUED',
  'REJECTED',
  'REVOKED'
] as const

export const grantsListSchema = z.object({
  walletAddressId: z.string().min(1).optional().catch(undefined),
  state: z.enum(grantStates).optional().catch(undefined),
  cursor: z.string().min(1).optional().catch(undefined),
  direction: z.enum(['next', 'previous']).optional().catch(undefined),
  pageSize: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .optional()
    .catch(undefined),
  sortOrder: z.enum(['ASC', 'DESC']).optional().catch(undefined)
})

export type GrantListArgs = z.infer<typeof grantsListSchema>
type GrantsListResult = SuccessResponse<GrantsListResponse>
type GrantsListApiResponse = GrantsListResult | ErrorResponse

type GetGrantResult = SuccessResponse<GrantResponse>
type GetGrantResponse = GetGrantResult | ErrorResponse
type DeleteGrantResponse = SuccessResponse | ErrorResponse

type FinalizeInteractionParams = {
  interactionId: string
  nonce: string
  action: string
}
type FinalizeInteractionResponse = SuccessResponse | ErrorResponse

interface GrantsService {
  list: (
    args?: GrantListArgs,
    cookies?: string
  ) => Promise<GrantsListApiResponse>
  get: (grantId: string, cookies?: string) => Promise<GetGrantResponse>
  getInteraction: (
    interactionId: string,
    nonce: string,
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

  async getInteraction(interactionId, nonce, cookies) {
    try {
      const response = await httpClient
        .get(`grant-interactions/${interactionId}/${nonce}`, {
          headers: {
            ...(cookies ? { Cookie: cookies } : {})
          }
        })
        .json<GetGrantResponse>()
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
