import { Env } from '@/config/env'
import { GraphQLClient } from 'graphql-request'
import {
  getGrantByIdQuery,
  getGrantsQuery,
  revokeGrantMutation
} from '@/rafiki/auth/request/grant.request'
import {
  GetGrantQuery,
  GetGrantQueryVariables,
  GetGrantsQuery,
  GetGrantsQueryVariables,
  Grant,
  RevokeGrantMutation,
  RevokeGrantMutationVariables
} from '@/rafiki/auth/generated/graphql'
import axios from 'axios'

interface IRafikiAuthService {
  listGrants(identifiers: string[]): Promise<Grant[]>
  getGrantById(id: string): Promise<Grant>
  revokeGrant(id: string): Promise<void>
}

export class RafikiAuthService implements IRafikiAuthService {
  constructor(
    private env: Env,
    private gqlClient: GraphQLClient
  ) {}

  async listGrants(identifiers: string[]) {
    if (!identifiers.length) {
      return []
    }

    const response = await this.gqlClient.request<
      GetGrantsQuery,
      GetGrantsQueryVariables
    >(getGrantsQuery, { filter: { identifier: { in: identifiers } } })

    return response.grants.edges.map((el: { node: Grant }) => el.node)
  }

  async revokeGrant(grantId: string) {
    const response = await this.gqlClient.request<
      RevokeGrantMutation,
      RevokeGrantMutationVariables
    >(revokeGrantMutation, { grantId })

    if (!response.revokeGrant.success) {
      throw new Error(response.revokeGrant.message)
    }
  }

  async getGrantById(grantId: string) {
    const response = await this.gqlClient.request<
      GetGrantQuery,
      GetGrantQueryVariables
    >(getGrantByIdQuery, { grantId })

    return response.grant
  }

  async getGrantByInteraction(interactionId: string, nonce: string) {
    const response = await axios.get(
      `${this.env.AUTH_DOMAIN}/grant/${interactionId}/${nonce}`,
      {
        headers: {
          'x-idp-secret': this.env.AUTH_IDENTITY_SERVER_SECRET
        }
      }
    )

    return response.data
  }

  async setInteractionResponse(
    interactionId: string,
    nonce: string,
    acceptance: 'accept' | 'reject'
  ) {
    const response = await axios.post(
      `${this.env.AUTH_DOMAIN}/grant/${interactionId}/${nonce}/${acceptance}`,
      {},
      {
        headers: {
          'x-idp-secret': this.env.AUTH_IDENTITY_SERVER_SECRET
        }
      }
    )

    return response.data
  }
}
