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
import { RapydController } from '@/rapyd/controller'
import { RapydClient } from '@/rapyd/rapyd-client'
import { RapydService } from '@/rapyd/service'
import { SessionService } from '@/session/service'
import { TransactionController } from '@/transaction/controller'
import { TransactionService } from '@/transaction/service'
import { UserController } from '@/user/controller'
import { UserService } from '@/user/service'
import { type Knex } from 'knex'
import { SocketService } from './socket/service'
import { GrantService } from './grant/service'
import { RatesService } from './rates/service'
import { WMTransactionService } from '@/webMonetization/transaction/service'
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
import { createWalletAddressService } from '@/config/walletAddress'
import { createRafikiAuthService, createRafikiClient } from '@/config/rafiki'
import { WalletAddressKeyController } from '@/walletAddressKeys/controller'
import { WalletAddressKeyService } from '@/walletAddressKeys/service'
import { generateKnex } from '@/config/knex'
import { generateLogger } from '@/config/logger'
import { RedisClient } from '@shared/backend'

export interface Cradle {
  env: Env
  logger: Logger
  knex: Knex
  sessionService: SessionService
  emailService: EmailService
  userService: UserService
  authService: AuthService
  rapydClient: RapydClient
  rapydService: RapydService
  rafikiClient: RafikiClient
  rafikiAuthService: RafikiAuthService
  accountService: AccountService
  ratesService: RatesService
  redisClient: RedisClient
  wmTransactionService: WMTransactionService
  walletAddressService: WalletAddressService
  walletAddressKeyService: WalletAddressKeyService
  transactionService: TransactionService
  incomingPaymentService: IncomingPaymentService
  outgoingPaymentService: OutgoingPaymentService
  rafikiService: RafikiService
  quoteService: QuoteService
  grantService: GrantService
  socketService: SocketService
  userController: UserController
  authController: AuthController
  assetController: AssetController
  accountController: AccountController
  rapydController: RapydController
  transactionController: TransactionController
  incomingPaymentController: IncomingPaymentController
  outgoingPaymentController: OutgoingPaymentController
  rafikiController: RafikiController
  quoteController: QuoteController
  grantController: GrantController
  walletAddressController: WalletAddressController
  walletAddressKeyController: WalletAddressKeyController
}

export async function createContainer(
  env: Env
): Promise<AwilixContainer<Cradle>> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  container.register({
    env: asValue(env),
    logger: asFunction(generateLogger).singleton(),
    knex: asFunction(generateKnex).singleton(),
    sessionService: asClass(SessionService).singleton(),
    emailService: asClass(EmailService).singleton(),
    userService: asClass(UserService).singleton(),
    authService: asClass(AuthService).singleton(),
    rapydClient: asClass(RapydClient).singleton(),
    rapydService: asClass(RapydService).singleton(),
    rafikiClient: asFunction(createRafikiClient).singleton(),
    rafikiAuthService: asFunction(createRafikiAuthService).singleton(),
    accountService: asClass(AccountService).singleton(),
    ratesService: asClass(RatesService).singleton(),
    redisClient: asFunction(createRedis).singleton(),
    wmTransactionService: asClass(WMTransactionService).singleton(),
    transactionService: asClass(TransactionService).singleton(),
    walletAddressService: asFunction(createWalletAddressService).singleton(),
    walletAddressKeyService: asClass(WalletAddressKeyService).singleton(),
    incomingPaymentService: asClass(IncomingPaymentService).singleton(),
    outgoingPaymentService: asClass(OutgoingPaymentService).singleton(),
    rafikiService: asClass(RafikiService).singleton(),
    quoteService: asClass(QuoteService).singleton(),
    grantService: asClass(GrantService).singleton(),
    socketService: asClass(SocketService).singleton(),
    userController: asClass(UserController).singleton(),
    authController: asClass(AuthController).singleton(),
    assetController: asClass(AssetController).singleton(),
    accountController: asClass(AccountController).singleton(),
    rapydController: asClass(RapydController).singleton(),
    transactionController: asClass(TransactionController).singleton(),
    incomingPaymentController: asClass(IncomingPaymentController).singleton(),
    outgoingPaymentController: asClass(OutgoingPaymentController).singleton(),
    rafikiController: asClass(RafikiController).singleton(),
    quoteController: asClass(QuoteController).singleton(),
    grantController: asClass(GrantController).singleton(),
    walletAddressController: asClass(WalletAddressController).singleton(),
    walletAddressKeyController: asClass(WalletAddressKeyController).singleton()
  })

  return container
}
