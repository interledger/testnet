import { GraphQLClient } from 'graphql-request'
import knex from 'knex'
import { AccountController } from './account/controller'
import { AccountService } from './account/service'
import { Bindings } from './app'
import { AssetController } from './asset/controller'
import { AuthController } from './auth/controller'
import { AuthService } from './auth/service'
import { Env } from './config/env'
import { logger } from './config/logger'
import { RafikiClient } from './rafiki/rafiki-client'
import { RapydClient } from './rapyd/rapyd-client'
import { SessionService } from './session/service'
import { Container } from './shared/container'
import { UserController } from './user/controller'
import { UserService } from './user/service'
import { RapydService } from './rapyd/service'
import { RapydController } from './rapyd/controller'

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

  //* RAPYD

  container.singleton(
    'rapydClient',
    async () =>
      new RapydClient({
        logger: await container.resolve('logger'),
        env: await container.resolve('env')
      })
  )

  container.singleton(
    'rapydService',
    async () =>
      new RapydService({
        logger: await container.resolve('logger'),
        rapyd: await container.resolve('rapydClient')
      })
  )

  container.singleton(
    'rapydController',
    async () =>
      new RapydController({
        logger: await container.resolve('logger'),
        rapydService: await container.resolve('rapydService')
      })
  )

  //*RAFIKI

  container.singleton(
    'rafikiClient',
    async () =>
      new RafikiClient({
        env: await container.resolve('env'),
        gqlClient: await container.resolve('gqlClient'),
        logger: await container.resolve('logger')
      })
  )

  //* Asset

  container.singleton(
    'assetController',
    async () =>
      new AssetController({
        rafikiClient: await container.resolve('rafikiClient'),
        logger: await container.resolve('logger')
      })
  )

  //* Account
  container.singleton(
    'accountService',
    async () =>
      new AccountService({
        logger: await container.resolve('logger'),
        rafiki: await container.resolve('rafikiClient'),
        rapyd: await container.resolve('rapydClient')
      })
  )

  container.singleton(
    'accountController',
    async () =>
      new AccountController({
        logger: await container.resolve('logger'),
        accountService: await container.resolve('accountService')
      })
  )

  return container
}
