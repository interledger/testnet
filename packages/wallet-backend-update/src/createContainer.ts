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
import { RapydClient } from './rapyd/rapyd-client'
import { RapydWalletService } from './rapyd/wallet/service'
import { RapydWalletController } from './rapyd/wallet/controller'
import { RapydCountriesService } from './rapyd/countries/service'
import { RapydCountriesController } from './rapyd/countries/controller'
import { RapyddocumentsService } from './rapyd/documents/service'
import { RapydDocumentsController } from './rapyd/documents/controller'
import { Asset } from './rafiki/generated/graphql'
import { AssetController } from './asset/controller'
import { RafikiClient } from './rafiki/rafiki-client'
import { AccountService } from './account/service'
import { AccountController } from './account/controller'

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
    'rapydWalletService',
    async () =>
      new RapydWalletService({
        env: await container.resolve('env'),
        logger: await container.resolve('logger'),
        rapyd: await container.resolve('rapydClient')
      })
  )

  container.singleton(
    'rapydWalletController',
    async () =>
      new RapydWalletController({
        logger: await container.resolve('logger'),
        walletService: await container.resolve('rapydWalletService')
      })
  )

  container.singleton(
    'rapydCountriesService',
    async () =>
      new RapydCountriesService({
        logger: await container.resolve('logger'),
        rapyd: await container.resolve('rapydClient')
      })
  )

  container.singleton(
    'rapydCountriesController',
    async () =>
      new RapydCountriesController({
        logger: await container.resolve('logger'),
        rapydCountriesService: await container.resolve('rapydCountriesService')
      })
  )

  container.singleton(
    'rapydDocumentsService',
    async () =>
      new RapyddocumentsService({
        logger: await container.resolve('logger'),
        rapyd: await container.resolve('rapydClient')
      })
  )

  container.singleton(
    'rapydDocumentsController',
    async () =>
      new RapydDocumentsController({
        logger: await container.resolve('logger'),
        rapydDocumentsService: await container.resolve('rapydDocumentsService')
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
