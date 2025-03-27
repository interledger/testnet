import { AccountController } from '@/account/controller'
import { AccountService } from '@/account/service'
import { AssetController } from '@/asset/controller'
import { AuthController } from '@/auth/controller'
import { AuthService } from '@/auth/service'
import { Env } from '@/config/env'
import { EmailService } from '@/email/service'
import { GrantController } from '@/grant/controller'
import { IncomingPaymentController } from '@/incomingPayment/controller'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'
import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { WalletAddressController } from '@/walletAddress/controller'
import { WalletAddressService } from '@/walletAddress/service'
import { QuoteController } from '@/quote/controller'
import { QuoteService } from '@/quote/service'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { RafikiController } from '@/rafiki/controller'
import { RafikiClient } from '@/rafiki/rafiki-client'
import { RafikiService } from '@/rafiki/service'
import { SessionService } from '@/session/service'
import { TransactionController } from '@/transaction/controller'
import { TransactionService } from '@/transaction/service'
import { UserController } from '@/user/controller'
import { UserService } from '@/user/service'
import { type Knex } from 'knex'
import { SocketService } from './socket/service'
import { GrantService } from './grant/service'
import { RatesService } from './rates/service'
import { Logger } from 'winston'
import {
  asClass,
  asFunction,
  asValue,
  AwilixContainer,
  InjectionMode
} from 'awilix'
import { createContainer as createAwilixContainer } from 'awilix/lib/container'
import { createRedis } from '@/config/redis'
import {
  createAuthGraphQLClient,
  createBackendGraphQLClient
} from '@/config/rafiki'
import { WalletAddressKeyController } from '@/walletAddressKeys/controller'
import { WalletAddressKeyService } from '@/walletAddressKeys/service'
import { generateKnex } from '@/config/knex'
import { asClassSingletonWithLogger, RedisClient } from '@shared/backend'
import { generateLogger } from '@/config/logger'
import { GraphQLClient } from 'graphql-request'
import { KratosService } from './rafiki/kratos.service'
import { GateHubController } from '@/gatehub/controller'
import { GateHubClient } from '@/gatehub/client'
import { GateHubService } from '@/gatehub/service'
import { CardController } from './card/controller'
import { CardService } from './card/service'
import { StripeController } from './stripe/controller'
import { StripeService } from './stripe/service'

export interface Cradle {
  env: Env
  logger: Logger
  knex: Knex
  sessionService: SessionService
  emailService: EmailService
  userService: UserService
  authService: AuthService
  backendGraphQLClient: GraphQLClient
  authGraphQLClient: GraphQLClient
  rafikiClient: RafikiClient
  rafikiAuthService: RafikiAuthService
  accountService: AccountService
  ratesService: RatesService
  redisClient: RedisClient
  walletAddressService: WalletAddressService
  walletAddressKeyService: WalletAddressKeyService
  transactionService: TransactionService
  incomingPaymentService: IncomingPaymentService
  outgoingPaymentService: OutgoingPaymentService
  rafikiService: RafikiService
  stripeService: StripeService
  quoteService: QuoteService
  grantService: GrantService
  socketService: SocketService
  userController: UserController
  authController: AuthController
  assetController: AssetController
  accountController: AccountController
  transactionController: TransactionController
  incomingPaymentController: IncomingPaymentController
  outgoingPaymentController: OutgoingPaymentController
  rafikiController: RafikiController
  stripeController: StripeController
  quoteController: QuoteController
  grantController: GrantController
  walletAddressController: WalletAddressController
  walletAddressKeyController: WalletAddressKeyController
  kratosService: KratosService
  gateHubClient: GateHubClient
  gateHubController: GateHubController
  gateHubService: GateHubService
  cardService: CardService
  cardController: CardController
}

export async function createContainer(
  env: Env
): Promise<AwilixContainer<Cradle>> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })
  const logger = generateLogger(env)

  container.register({
    env: asValue(env),
    logger: asValue(logger),
    knex: asFunction(generateKnex).singleton(),
    sessionService: asClass(SessionService).singleton(),
    emailService: asClassSingletonWithLogger(EmailService, logger),
    userService: asClassSingletonWithLogger(UserService, logger),
    authService: asClassSingletonWithLogger(AuthService, logger),
    backendGraphQLClient: asFunction(createBackendGraphQLClient).singleton(),
    authGraphQLClient: asFunction(createAuthGraphQLClient).singleton(),
    rafikiClient: asClass(RafikiClient).singleton(),
    rafikiAuthService: asClass(RafikiAuthService).singleton(),
    accountService: asClass(AccountService).singleton(),
    ratesService: asClass(RatesService).singleton(),
    redisClient: asFunction(createRedis).singleton(),
    transactionService: asClassSingletonWithLogger(TransactionService, logger),
    walletAddressService: asClassSingletonWithLogger(
      WalletAddressService,
      logger
    ),
    walletAddressKeyService: asClass(WalletAddressKeyService).singleton(),
    incomingPaymentService: asClass(IncomingPaymentService).singleton(),
    outgoingPaymentService: asClass(OutgoingPaymentService).singleton(),
    rafikiService: asClassSingletonWithLogger(RafikiService, logger),
    stripeService: asClassSingletonWithLogger(StripeService, logger),
    quoteService: asClass(QuoteService).singleton(),
    grantService: asClass(GrantService).singleton(),
    socketService: asClassSingletonWithLogger(SocketService, logger),
    cardService: asClass(CardService).singleton(),
    userController: asClass(UserController).singleton(),
    authController: asClass(AuthController).singleton(),
    assetController: asClass(AssetController).singleton(),
    accountController: asClass(AccountController).singleton(),
    transactionController: asClass(TransactionController).singleton(),
    incomingPaymentController: asClass(IncomingPaymentController).singleton(),
    outgoingPaymentController: asClass(OutgoingPaymentController).singleton(),
    rafikiController: asClassSingletonWithLogger(RafikiController, logger),
    stripeController: asClassSingletonWithLogger(StripeController, logger),
    quoteController: asClass(QuoteController).singleton(),
    grantController: asClass(GrantController).singleton(),
    walletAddressController: asClass(WalletAddressController).singleton(),
    walletAddressKeyController: asClass(WalletAddressKeyController).singleton(),
    kratosService: asClassSingletonWithLogger(KratosService, logger),
    gateHubClient: asClass(GateHubClient).singleton(),
    gateHubController: asClass(GateHubController).singleton(),
    gateHubService: asClass(GateHubService).singleton(),
    cardController: asClass(CardController).singleton()
  })

  return container
}
