import { Env } from '@/config/env'
import { GraphQLClient } from 'graphql-request'

export function createBackendGraphQLClient(env: Env) {
  return new GraphQLClient(env.GRAPHQL_ENDPOINT)
}

export function createAuthGraphQLClient(env: Env) {
  return new GraphQLClient(env.AUTH_GRAPHQL_ENDPOINT)
}
