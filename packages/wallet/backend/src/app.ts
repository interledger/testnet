import { EmailService } from '@/email/service'
import { GrantController } from '@/grant/controller'
import { IncomingPaymentController } from '@/incomingPayment/controller'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'
import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { WalletAddressController } from '@/walletAddress/controller'
import { WalletAddressService } from '@/walletAddress/service'
import { RafikiAuthService } from '@/rafiki/auth/service'
import { TransactionController } from '@/transaction/controller'
import { TransactionService } from '@/transaction/service'
import cors from 'cors'
import express, {
  NextFunction,
  Router,
  type Express,
  type Request
} from 'express'
import helmet from 'helmet'
import { Server } from 'http'
import type { Knex } from 'knex'
import { Model } from 'objection'
import type { Logger } from 'winston'
import { AccountController } from './account/controller'
import { AccountService } from './account/service'
import { AssetController } from './asset/controller'
import type { AuthController } from './auth/controller'
import type { AuthService } from './auth/service'
import type { Env } from './config/env'
import { isAuth } from './middleware/isAuth'
import { withSession } from './middleware/withSession'
import { rateLimiterEmail, rateLimiterLogin } from './middleware/rateLimit'
import { QuoteController } from './quote/controller'
import { QuoteService } from './quote/service'
import { RafikiController } from './rafiki/controller'
import { RafikiClient } from './rafiki/rafiki-client'
import { RafikiService } from './rafiki/service'
import { RatesService } from './rates/service'
import type { SessionService } from './session/service'
import { UserController } from './user/controller'
import type { UserService } from './user/service'
import { SocketService } from './socket/service'
import { GrantService } from '@/grant/service'
import { AwilixContainer } from 'awilix'
import { Cradle } from '@/createContainer'
import { Forbidden, initErrorHandler, RedisClient } from '@shared/backend'
import { GateHubController } from '@/gatehub/controller'
import { GateHubClient } from '@/gatehub/client'
import { GateHubService } from '@/gatehub/service'
import { CardController } from './card/controller'
import { CardService } from './card/service'
import { isRafikiSignedWebhook } from '@/middleware/isRafikiSignedWebhook'
import { isGateHubSignedWebhook } from '@/middleware/isGateHubSignedWebhook'

export interface Bindings {
  env: Env
  logger: Logger
  knex: Knex
  redisClient: RedisClient
  rafikiClient: RafikiClient
  rafikiService: RafikiService
  rafikiController: RafikiController
  ratesService: RatesService
  sessionService: SessionService
  userService: UserService
  accountService: AccountService
  userController: UserController
  authService: AuthService
  authController: AuthController
  assetController: AssetController
  accountController: AccountController
  walletAddressController: WalletAddressController
  walletAddressService: WalletAddressService
  transactionController: TransactionController
  transactionService: TransactionService
  incomingPaymentController: IncomingPaymentController
  incomingPaymentService: IncomingPaymentService
  outgoingPaymentController: OutgoingPaymentController
  outgoingPaymentService: OutgoingPaymentService
  quoteController: QuoteController
  quoteService: QuoteService
  rafikiAuthService: RafikiAuthService
  grantController: GrantController
  grantService: GrantService
  emailService: EmailService
  socketService: SocketService
  gateHubClient: GateHubClient
  gateHubController: GateHubController
  gateHubService: GateHubService
  cardService: CardService
  cardController: CardController
}

export class App {
  private server!: Server

  constructor(private container: AwilixContainer<Cradle>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = this.container.resolve('env')
    const logger = this.container.resolve('logger')
    const knex = this.container.resolve('knex')
    const socketService = this.container.resolve('socketService')

    await knex.migrate.latest({
      directory: __dirname + '/../migrations'
    })
    Model.knex(knex)

    this.server = express.listen(env.PORT)
    logger.info(`Server started on port ${env.PORT}`)

    socketService.init(this.server)
  }

  public stop = async (): Promise<void> => {
    this.server.close()
  }

  public getPort(): number {
    const address = this.server.address()
    if (address && !(typeof address === 'string')) {
      return address.port
    }
    return 0
  }

  // TODO: Rate limiting
  private async init(): Promise<Express> {
    const app = express()
    const router = Router()

    const env = this.container.resolve('env')
    const logger = this.container.resolve('logger')
    const authController = this.container.resolve('authController')
    const userController = this.container.resolve('userController')
    const walletAddressController = this.container.resolve(
      'walletAddressController'
    )
    const walletAddressKeyController = this.container.resolve(
      'walletAddressKeyController'
    )
    const transactionController = this.container.resolve(
      'transactionController'
    )
    const incomingPaymentController = this.container.resolve(
      'incomingPaymentController'
    )
    const outgoingPaymentController = this.container.resolve(
      'outgoingPaymentController'
    )

    const quoteController = this.container.resolve('quoteController')
    const assetController = this.container.resolve('assetController')
    const grantController = this.container.resolve('grantController')
    const accountController = this.container.resolve('accountController')
    const rafikiController = this.container.resolve('rafikiController')
    const stripeController = env.USE_STRIPE
      ? this.container.resolve('stripeController')
      : undefined
    const gateHubController = this.container.resolve('gateHubController')
    const cardController = this.container.resolve('cardController')

    app.use(
      cors({
        origin: [
          'http://localhost:4003',
          `https://${env.RAFIKI_MONEY_FRONTEND_HOST}`,
          `https://wallet.${env.RAFIKI_MONEY_FRONTEND_HOST}`
        ],
        credentials: true
      })
    )

    app.use(helmet())

    // Stripe webhook signature validation requires raw body, parsing is done afterwards
    if (env.USE_STRIPE && stripeController) {
      app.post(
        '/stripe-webhooks',
        stripeController.webhookMiddleware,
        stripeController.onWebHook
      )
    }

    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))
    app.use(withSession)

    // Auth Routes
    router.post('/signup', authController.signUp)
    router.post('/login', rateLimiterLogin, authController.logIn)
    router.post('/logout', isAuth, authController.logOut)

    // Reset password routes
    router.post(
      '/forgot-password',
      rateLimiterEmail,
      userController.requestResetPassword
    )
    router.get('/reset-password/:token/validate', userController.checkToken)
    router.post('/reset-password/:token', userController.resetPassword)
    router.post('/verify-email/:token', authController.verifyEmail)
    router.post(
      '/resend-verify-email',
      rateLimiterEmail,
      authController.resendVerifyEmail
    )
    router.patch('/change-password', isAuth, userController.changePassword)
    router.patch(
      '/change-cards-visibility',
      isAuth,
      userController.changeCardsVisibility
    )

    // Me Endpoint
    router.get('/me', userController.me)

    // wallet address routes
    router.post(
      '/accounts/:accountId/wallet-addresses',
      isAuth,
      walletAddressController.create
    )
    router.get(
      '/accounts/:accountId/wallet-addresses',
      isAuth,
      walletAddressController.list
    )
    router.get(
      '/accounts/:accountId/wallet-addresses/:id',
      isAuth,
      walletAddressController.getById
    )
    router.get(
      '/external-wallet-addresses',
      isAuth,
      walletAddressController.getExternalWalletAddress
    )
    router.patch(
      '/accounts/:accountId/wallet-addresses/:walletAddressId',
      isAuth,
      walletAddressController.update
    )
    router.delete(
      '/wallet-addresses/:id',
      isAuth,
      walletAddressController.softDelete
    )

    router.get('/wallet-addresses', isAuth, walletAddressController.listAll)

    // transactions routes
    router.get(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/transactions',
      isAuth,
      transactionController.list
    )
    router.get('/transactions', isAuth, transactionController.listAll)

    router.post(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/register-key',
      isAuth,
      walletAddressKeyController.registerKey
    )
    router.patch(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/:keyId/revoke-key',
      isAuth,
      walletAddressKeyController.revokeKey
    )

    router.post(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/upload-key',
      isAuth,
      walletAddressKeyController.uploadKey
    )

    router.patch(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/keys/:keyId',
      isAuth,
      walletAddressKeyController.patchKey
    )

    router.post(
      '/revoke-keys',
      isAuth,
      walletAddressKeyController.batchRevokeKeys
    )

    router.get(
      '/accounts/:accountId/wallet-addresses/:walletAddressId/keys',
      isAuth,
      walletAddressKeyController.list
    )

    // incoming payment routes
    router.post('/incoming-payments', isAuth, incomingPaymentController.create)
    router.get(
      '/payment-details',
      isAuth,
      incomingPaymentController.getPaymentDetailsByUrl
    )

    // outgoing payment routes
    router.post('/quotes', isAuth, quoteController.create)
    router.post('/outgoing-payments', isAuth, outgoingPaymentController.create)

    // asset
    router.get('/assets', isAuth, assetController.list)

    // grant
    router.get('/grants', isAuth, grantController.list)
    router.post('/list-grants', isAuth, grantController.listWithPagination)
    router.get('/grants/:id', isAuth, grantController.getById)
    router.delete('/grants/:id', isAuth, grantController.revoke)
    router.get(
      '/grant-interactions/:interactionId/:nonce/',
      isAuth,
      grantController.getByInteraction
    )
    router.patch(
      '/grant-interactions/:interactionId/:nonce',
      isAuth,
      grantController.setInteractionResponse
    )

    // account
    router.post('/accounts', isAuth, accountController.createAccount)
    router.patch('/accounts/:accountId', isAuth, accountController.patchAccount)
    router.get('/accounts', isAuth, accountController.listAccounts)
    router.get('/accounts/:id', isAuth, accountController.getAccountById)

    // Fund account is possible only in sandbox
    if (env.GATEHUB_ENV === 'sandbox') {
      router.post(
        '/accounts/:accountId/fund',
        isAuth,
        accountController.fundAccount
      )
    }

    router.get('/rates', rafikiController.getRates)
    router.post('/webhooks', isRafikiSignedWebhook, rafikiController.onWebHook)

    // GateHub
    router.get('/iframe-urls/:type', isAuth, gateHubController.getIframeUrl)
    router.post(
      '/gatehub-webhooks',
      isGateHubSignedWebhook(env, logger),
      gateHubController.webhook
    )
    router.post(
      '/gatehub/add-user-to-gateway',
      isAuth,
      gateHubController.addUserToGateway
    )

    // Cards
    router.get('/customers/cards', isAuth, cardController.getCardsByCustomer)
    router.post('/cards/:cardId/details', isAuth, cardController.getCardDetails)
    router.get(
      '/cards/:cardId/transactions',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.getCardTransactions
    )
    router.get(
      '/cards/:cardId/limits',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.getCardLimits
    )
    router.post(
      '/cards/:cardId/limits',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.createOrOverrideCardLimits
    )
    router.post(
      '/cards/:cardId/pin',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.getPin
    )
    router.get(
      '/cards/:cardId/change-pin-token',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.getTokenForPinChange
    )
    router.post(
      '/cards/:cardId/change-pin',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.changePin
    )
    router.put(
      '/cards/:cardId/lock',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.lock
    )
    router.put(
      '/cards/:cardId/unlock',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.unlock
    )
    router.delete(
      '/cards/:cardId/block',
      this.ensureGateHubProductionEnv,
      isAuth,
      cardController.closeCard
    )

    // Return an error for invalid routes
    router.use('*', (req: Request, res: CustomResponse) => {
      const e = Error(`Requested path ${req.path} was not found`)

      res.status(404).send({
        success: false,
        message: e.message,
        stack: env.NODE_ENV === 'development' ? e.stack : undefined
      })
    })

    // Global error handler
    router.use(initErrorHandler(logger))

    app.use(router)

    return app
  }

  private async processPendingTransactions() {
    const transactionService = this.container.resolve('transactionService')
    return transactionService
      .processPendingIncomingPayments()
      .catch(() => false)
      .then((trx) => {
        if (trx) {
          process.nextTick(() => this.processPendingTransactions())
        } else {
          setTimeout(() => this.processPendingTransactions(), 5000).unref()
        }
      })
  }

  async processResources() {
    process.nextTick(() => this.processPendingTransactions())
  }

  ensureGateHubProductionEnv = async (
    _req: Request,
    _res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const env = this.container.resolve('env')
      if (env.NODE_ENV === 'production' && env.GATEHUB_ENV === 'sandbox') {
        throw new Forbidden('You cannot access this resource')
      }
    } catch (e) {
      next(e)
    }

    next()
  }
}
