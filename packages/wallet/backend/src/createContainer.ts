import { AccountController } from '@/account/controller'
import { AccountService } from '@/account/service'
import { Bindings } from '@/app'
import { AssetController } from '@/asset/controller'
import { AuthController } from '@/auth/controller'
import { AuthService } from '@/auth/service'
import { Env } from '@/config/env'
import { logger } from '@/config/logger'
import { EmailService } from '@/email/service'
import { GrantController } from '@/grant/controller'
import { IncomingPaymentController } from '@/incomingPayment/controller'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'
import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { PaymentPointerController } from '@/paymentPointer/controller'
import { PaymentPointerService } from '@/paymentPointer/service'
import { QuoteController } from '@/quote/controller'
import { QuoteService } from '@/quote/service'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { RafikiController } from '@/rafiki/controller'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { RafikiService } from '@/rafiki/service'
import { RapydController } from '@/rapyd/controller'
import { RapydClient } from '@/rapyd/rapyd-client'
import { RapydService } from '@/rapyd/service'
import { SessionService } from '@/session/service'
import { Container } from '@/shared/container'
import { TransactionController } from '@/transaction/controller'
import { TransactionService } from '@/transaction/service'
import { UserController } from '@/user/controller'
import { UserService } from '@/user/service'
import { GraphQLClient } from 'graphql-request'
import knex from 'knex'
import { SocketService } from './socket/service'

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

  container.singleton('sessionService', async () => new SessionService())
  container.singleton(
    'emailService',
    async () =>
      new EmailService({
        env: await container.resolve('env'),
        logger: await container.resolve('logger')
      })
  )

  container.singleton(
    'userService',
    async () =>
      new UserService({
        emailService: await container.resolve('emailService'),
        logger: await container.resolve('logger')
      })
  )

  container.singleton(
    'userController',
    async () =>
      new UserController({
        userService: await container.resolve('userService'),
        sessionService: await container.resolve('sessionService'),
        logger: await container.resolve('logger')
      })
  )

  container.singleton(
    'authService',
    async () =>
      new AuthService({
        env: await container.resolve('env'),
        userService: await container.resolve('userService'),
        logger: await container.resolve('logger'),
        emailService: await container.resolve('emailService')
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

  container.singleton('rafikiClient', async () => {
    const env = await container.resolve('env')
    return new RafikiClient({
      env: env,
      gqlClient: new GraphQLClient(env.GRAPHQL_ENDPOINT),
      logger: await container.resolve('logger')
    })
  })

  //*RAFIKI AUTH

  container.singleton('rafikiAuthService', async () => {
    const env = await container.resolve('env')
    return new RafikiAuthService({
      env: env,
      gqlClient: new GraphQLClient(env.AUTH_GRAPHQL_ENDPOINT),
      logger: await container.resolve('logger')
    })
  })

  container.singleton(
    'assetController',
    async () =>
      new AssetController({
        rafikiClient: await container.resolve('rafikiClient'),
        logger: await container.resolve('logger')
      })
  )

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

  container.singleton(
    'rapydController',
    async () =>
      new RapydController({
        accountService: await container.resolve('accountService'),
        paymentPointerService: await container.resolve('paymentPointerService'),
        logger: await container.resolve('logger'),
        rapydService: await container.resolve('rapydService'),
        socketService: await container.resolve('socketService')
      })
  )

  container.singleton(
    'paymentPointerService',
    async () =>
      new PaymentPointerService({
        env: await container.resolve('env'),
        rafikiClient: await container.resolve('rafikiClient'),
        accountService: await container.resolve('accountService')
      })
  )

  container.singleton(
    'paymentPointerController',
    async () =>
      new PaymentPointerController({
        logger: await container.resolve('logger'),
        paymentPointerService: await container.resolve('paymentPointerService')
      })
  )

  container.singleton(
    'transactionService',
    async () =>
      new TransactionService({
        accountService: await container.resolve('accountService'),
        logger: await container.resolve('logger'),
        knex: await container.resolve('knex')
      })
  )

  container.singleton(
    'transactionController',
    async () =>
      new TransactionController({
        transactionService: await container.resolve('transactionService')
      })
  )

  container.singleton(
    'incomingPaymentService',
    async () =>
      new IncomingPaymentService({
        accountService: await container.resolve('accountService'),
        rafikiClient: await container.resolve('rafikiClient')
      })
  )

  container.singleton(
    'incomingPaymentController',
    async () =>
      new IncomingPaymentController({
        incomingPaymentService: await container.resolve(
          'incomingPaymentService'
        )
      })
  )

  container.singleton(
    'outgoingPaymentService',
    async () =>
      new OutgoingPaymentService({
        rafikiClient: await container.resolve('rafikiClient'),
        incomingPaymentService: await container.resolve(
          'incomingPaymentService'
        )
      })
  )

  container.singleton(
    'outgoingPaymentController',
    async () =>
      new OutgoingPaymentController({
        outgoingPaymentService: await container.resolve(
          'outgoingPaymentService'
        )
      })
  )

  container.singleton('rafikiService', async () => {
    const rapydClient = await container.resolve('rapydClient')
    const env = await container.resolve('env')
    const logger = await container.resolve('logger')
    const rafikiClient = await container.resolve('rafikiClient')
    const transactionService = await container.resolve('transactionService')
    const socketService = await container.resolve('socketService')
    const userService = await container.resolve('userService')

    return new RafikiService({
      rafikiClient,
      rapydClient,
      env,
      logger,
      transactionService,
      socketService,
      userService
    })
  })

  container.singleton('rafikiController', async () => {
    const logger = await container.resolve('logger')
    const rafikiService = await container.resolve('rafikiService')

    return new RafikiController({ logger, rafikiService })
  })

  container.singleton(
    'quoteService',
    async () =>
      new QuoteService({
        accountService: await container.resolve('accountService'),
        incomingPaymentService: await container.resolve(
          'incomingPaymentService'
        ),
        rafikiClient: await container.resolve('rafikiClient'),
        rafikiService: await container.resolve('rafikiService'),
        paymentPointerService: await container.resolve('paymentPointerService')
      })
  )

  container.singleton(
    'quoteController',
    async () =>
      new QuoteController({
        quoteService: await container.resolve('quoteService')
      })
  )

  container.singleton(
    'grantController',
    async () =>
      new GrantController({
        rafikiAuthService: await container.resolve('rafikiAuthService'),
        paymentPointerService: await container.resolve('paymentPointerService')
      })
  )

  container.singleton(
    'socketService',
    async () =>
      new SocketService({
        env: await container.resolve('env'),
        logger: await container.resolve('logger'),
        accountService: await container.resolve('accountService')
      })
  )

  return container
}
