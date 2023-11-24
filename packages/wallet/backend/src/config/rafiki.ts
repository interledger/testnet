import { Env } from '@/config/env'
import { Logger } from 'winston'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { GraphQLClient } from 'graphql-request'
import { RafikiAuthService } from '@/rafiki/auth/service'

export function createRafikiClient(env: Env, logger: Logger) {
  return new RafikiClient(logger, new GraphQLClient(env.GRAPHQL_ENDPOINT))
}

export function createRafikiAuthService(env: Env) {
  return new RafikiAuthService(
    env,
    new GraphQLClient(env.AUTH_GRAPHQL_ENDPOINT)
  )
}
