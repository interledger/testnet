import { Env } from '@/config/env'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { GraphQLClient } from 'graphql-request'
import { RafikiAuthService } from '@/rafiki/auth/service'

export function createRafikiClient(env: Env, logger: Logger) {
  return new RafikiClient({
    env: env,
    gqlClient: new GraphQLClient(env.GRAPHQL_ENDPOINT),
    logger
  })
}

export function createRafikiAuthService(env: Env, logger: Logger) {
  return new RafikiAuthService({
    env: env,
    gqlClient: new GraphQLClient(env.GRAPHQL_ENDPOINT),
    logger
  })
}
