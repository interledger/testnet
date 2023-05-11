import knex from 'knex'
import { Container } from './shared/container'
import { Bindings } from './app'
import { AuthController } from './auth/controller'
import { AuthService } from './auth/service'
import { Env } from './config/env'
import { logger } from './config/logger'
import { SessionService } from './session/service'
import { UserController } from './user/controller'
import { UserService } from './user/service'
import { GraphQLClient } from 'graphql-request'

export const createContainer = (config: Env): Container<Bindings> => {
  const container = new Container<Bindings>()
  container.singleton('env', async () => config)
  container.singleton('logger', async () => logger)
  container.singleton('knex', async () => {
    const env = await container.resolve('env')
    const _knex = knex({
      client: 'postgresql',
      connection: env.DATABASE_URL,
      migrations: {
        directory: './',
        tableName: 'knex_migrations'
      }
    })

    _knex.client.driver.types.setTypeParser(
      _knex.client.driver.types.builtins.INT8,
      'text',
      BigInt
    )
    return _knex
  })

  //GraphqlClient
  container.singleton(
    'gqlClient',
    async () =>
      new GraphQLClient((await container.resolve('env')).GRAPHQL_ENDPOINT)
  )

  // Session Modules
  container.singleton('sessionService', async () => new SessionService())

  // User Modules
  container.singleton('userService', async () => new UserService())
  container.singleton(
    'userController',
    async () =>
      new UserController({
        userService: await container.resolve('userService'),
        sessionService: await container.resolve('sessionService'),
        logger: await container.resolve('logger')
      })
  )

  // Auth Modules
  container.singleton(
    'authService',
    async () =>
      new AuthService({
        env: await container.resolve('env'),
        userService: await container.resolve('userService')
      })
  )

  container.singleton(
    'authController',
    async () =>
      new AuthController({
        authService: await container.resolve('authService'),
        logger: await container.resolve('logger'),
        userService: await container.resolve('userService')
      })
  )

  return container
}
