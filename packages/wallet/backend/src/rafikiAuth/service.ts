import { Logger } from 'winston'
import { Env } from '@/config/env'
import { GraphQLClient } from 'graphql-request'
import {
  getGrantsQuery,
  revokeGrantMutation
} from '@/rafikiAuth/request/grant.request'
import {
  GetGrantsQuery,
  GetGrantsQueryVariables,
  Grant,
  RevokeGrantMutation,
  RevokeGrantMutationVariables
} from '@/rafikiAuth/generated/graphql'

interface IRafikiAuthService {
  listGrants(): Promise<Grant[]>
  revokeGrant(id: string): Promise<void>
}

interface RafikiAuthServiceDependencies {
  logger: Logger
  env: Env
  gqlClient: GraphQLClient
}

export class RafikiAuthService implements IRafikiAuthService {
  constructor(private deps: RafikiAuthServiceDependencies) {}

  async listGrants() {
    const response = await this.deps.gqlClient.request<
      GetGrantsQuery,
      GetGrantsQueryVariables
    >(getGrantsQuery, {})

    return response.grants.edges.map((el: { node: Grant }) => el.node)
  }

  async revokeGrant(grantId: string) {
    const response = await this.deps.gqlClient.request<
      RevokeGrantMutation,
      RevokeGrantMutationVariables
    >(revokeGrantMutation, { grantId })

    if (!response.revokeGrant.success) {
      throw new Error(response.revokeGrant.message)
    }
  }
}
