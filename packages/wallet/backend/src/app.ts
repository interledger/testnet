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
import express, { Router, type Express, type Request } from 'express'
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
import { QuoteController } from './quote/controller'
import { QuoteService } from './quote/service'
import { RafikiController } from './rafiki/controller'
import { RafikiClient } from './rafiki/rafiki-client'
import { RafikiService } from './rafiki/service'
import { RapydController } from './rapyd/controller'
import { RapydClient } from './rapyd/rapyd-client'
import { RapydService } from './rapyd/service'
import { RatesService } from './rates/service'
import type { SessionService } from './session/service'
import { UserController } from './user/controller'
import type { UserService } from './user/service'
import { SocketService } from './socket/service'
import { GrantService } from '@/grant/service'
import { AwilixContainer } from 'awilix'
import { Cradle } from '@/createContainer'
import { initErrorHandler, RedisClient } from '@shared/backend'

export interface Bindings {
  env: Env
  logger: Logger
  knex: Knex
  redisClient: RedisClient
  rapydClient: RapydClient
  rafikiClient: RafikiClient
  rafikiService: RafikiService
  rafikiController: RafikiController
  rapydService: RapydService
  ratesService: RatesService
  sessionService: SessionService
  userService: UserService
  accountService: AccountService
  rapydController: RapydController
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
}

export class App {
  private server!: Server

  constructor(private container: AwilixContainer<Cradle>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = await this.container.resolve('env')
    const logger = await this.container.resolve('logger')
    const knex = await this.container.resolve('knex')
    const socketService = await this.container.resolve('socketService')

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

    const env = await this.container.resolve('env')
    const logger = await this.container.resolve('logger')
    const authController = await this.container.resolve('authController')
    const userController = await this.container.resolve('userController')
    const walletAddressController = await this.container.resolve(
      'walletAddressController'
    )
    const walletAddressKeyController = await this.container.resolve(
      'walletAddressKeyController'
    )
    const transactionController = await this.container.resolve(
      'transactionController'
    )
    const incomingPaymentController = await this.container.resolve(
      'incomingPaymentController'
    )
    const outgoingPaymentController = await this.container.resolve(
      'outgoingPaymentController'
    )

    const quoteController = await this.container.resolve('quoteController')
    const rapydController = await this.container.resolve('rapydController')
    const assetController = await this.container.resolve('assetController')
    const grantController = await this.container.resolve('grantController')
    const accountController = await this.container.resolve('accountController')
    const rafikiController = await this.container.resolve('rafikiController')

    app.use(
      cors({
        origin: [
          'http://localhost:4003',
          `https://${env.RAFIKI_MONEY_FRONTEND_HOST}`
        ],
        credentials: true
      })
    )

    app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))
    app.use(withSession)

    // Auth Routes
    router.post('/signup', authController.signUp)
    router.post('/login', authController.logIn)
    router.post('/logout', isAuth, authController.logOut)

    // Reset password routes
    router.post('/forgot-password', userController.requestResetPassword)
    router.get('/reset-password/:token/validate', userController.checkToken)
    router.post('/reset-password/:token', userController.resetPassword)
    router.post('/verify-email/:token', authController.verifyEmail)
    router.patch('/change-password', isAuth, userController.changePassword)

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

    // rapyd routes
    router.get('/countries', isAuth, rapydController.getCountryNames)
    router.get('/documents', isAuth, rapydController.getDocumentTypes)
    router.post('/wallet', isAuth, rapydController.createWallet)
    router.post('/updateProfile', isAuth, rapydController.updateProfile)
    router.post('/verify', isAuth, rapydController.verifyIdentity)

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
    router.get('/accounts', isAuth, accountController.listAccounts)
    router.get('/accounts/:id', isAuth, accountController.getAccountById)
    router.post(
      '/accounts/:accountId/exchange',
      isAuth,
      quoteController.createExchangeQuote
    )
    router.post('/accounts/fund', isAuth, accountController.fundAccount)
    router.post('/accounts/withdraw', isAuth, accountController.withdrawFunds)

    router.get('/rates', rafikiController.getRates)
    router.post('/webhooks', rafikiController.onWebHook)

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
    const transactionService =
      await this.container.resolve('transactionService')
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

  private async keepBalancesSynced(lastProcessedTimestamp: Date) {
    const logger = await this.container.resolve('logger')
    const walletAddressService = await this.container.resolve(
      'walletAddressService'
    )

    return walletAddressService
      .keepBalancesSynced(lastProcessedTimestamp)
      .catch((e) => {
        logger.error(e)
        return false
      })
      .then((trx) => {
        const newTimestamp = new Date()
        if (trx) {
          process.nextTick(() => this.keepBalancesSynced(newTimestamp))
        } else {
          setTimeout(
            () => this.keepBalancesSynced(lastProcessedTimestamp),
            1000 * 60 * 5
          ).unref()
        }
      })
  }

  async processResources() {
    process.nextTick(() => this.processPendingTransactions())
    process.nextTick(() => this.keepBalancesSynced(new Date()))
  }

  async createDefaultUsers() {
    const userService = this.container.resolve('userService')
    await userService.createDefaultAccount()
  }
}
