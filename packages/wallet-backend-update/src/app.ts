import { IncomingPaymentController } from '@/incomingPayment/controller'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'
import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { PaymentPointerController } from '@/paymentPointer/controller'
import { PaymentPointerService } from '@/paymentPointer/service'
import { TransactionController } from '@/transaction/controller'
import { TransactionService } from '@/transaction/service'
import express, {
  Router,
  type Express,
  type NextFunction,
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
import { errorHandler } from './middleware/errorHandler'
import { isAuth } from './middleware/isAuth'
import { withSession } from './middleware/withSession'
import { RafikiClient } from './rafiki/rafiki-client'
import { RapydController } from './rapyd/controller'
import { RapydClient } from './rapyd/rapyd-client'
import { RapydService } from './rapyd/service'
import type { SessionService } from './session/service'
import { Container } from './shared/container'
import { UserController } from './user/controller'
import type { UserService } from './user/service'
import cors from 'cors'

export interface Bindings {
  env: Env
  logger: Logger
  knex: Knex
  rapydClient: RapydClient
  rafikiClient: RafikiClient
  rapydService: RapydService
  sessionService: SessionService
  userService: UserService
  accountService: AccountService
  rapydController: RapydController
  userController: UserController
  authService: AuthService
  authController: AuthController
  assetController: AssetController
  accountController: AccountController
  paymentPointerController: PaymentPointerController
  paymentPointerService: PaymentPointerService
  transactionController: TransactionController
  transactionService: TransactionService
  incomingPaymentController: IncomingPaymentController
  incomingPaymentService: IncomingPaymentService
  outgoingPaymentController: OutgoingPaymentController
  outgoingPaymentService: OutgoingPaymentService
}

export class App {
  private server!: Server

  constructor(private container: Container<Bindings>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = await this.container.resolve('env')
    const logger = await this.container.resolve('logger')
    const knex = await this.container.resolve('knex')

    await knex.migrate.latest({
      directory: __dirname + '/../migrations'
    })
    Model.knex(knex)

    this.server = express.listen(env.PORT)
    logger.info(`Server started on port ${env.PORT}`)
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
    const authController = await this.container.resolve('authController')
    const userController = await this.container.resolve('userController')
    const paymentPointerController = await this.container.resolve(
      'paymentPointerController'
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
    const rapydController = await this.container.resolve('rapydController')
    const assetController = await this.container.resolve('assetController')
    const accountController = await this.container.resolve('accountController')

    app.use(
      cors({
        origin: 'http://localhost:4003',
        credentials: true
      })
    )
    app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))
    app.use(withSession)

    // Only allow JSON
    router.use('*', (req: Request, res: CustomResponse, next: NextFunction) => {
      if (req.is('application/json')) {
        next()
      } else {
        res.status(415).json({
          success: false,
          message: "Only 'application/json' content type is supported"
        })
      }
    })

    // Auth Routes
    router.post('/auth/sign-up', authController.signUp)
    router.post('/auth/log-in', authController.logIn)

    // Me Endpoint
    router.get('/me', isAuth, userController.me)

    // payment pointer routes
    router.post(
      '/accounts/:accountId/payment-pointers',
      isAuth,
      paymentPointerController.create
    )
    router.get(
      '/accounts/:accountId/payment-pointers',
      isAuth,
      paymentPointerController.list
    )
    router.get(
      '/accounts/:accountId/payment-pointers/:id',
      isAuth,
      paymentPointerController.getById
    )
    router.delete(
      '/payment-pointer/:id',
      isAuth,
      paymentPointerController.softDelete
    )

    // transactions routes
    router.get(
      '/accounts/:accountId/payment-pointers/:paymentPointerId/transactions',
      isAuth,
      transactionController.list
    )

    // incoming payment routes
    router.post('/incoming-payments', isAuth, incomingPaymentController.create)
    router.get(
      '/payment-details',
      isAuth,
      incomingPaymentController.getPaymentDetailsByUrl
    )

    // outgoing payment routes
    router.post('/outgoing-payments', isAuth, outgoingPaymentController.create)

    // rapyd routes
    router.get('/countries', rapydController.getCountryNames)
    router.get('/documents', rapydController.getDocumentTypes)
    router.post('/wallet', isAuth, rapydController.createWallet)
    router.post('/updateProfile', isAuth, rapydController.updateProfile)
    router.post('/verify', isAuth, rapydController.verifyIdentity)
    router.get('/documents', isAuth, rapydController.getDocumentTypes)

    // asset
    router.get('assets', isAuth, assetController.list)
    router.get('assets/:id', isAuth, assetController.getById)

    // account
    router.post('accounts', isAuth, accountController.createAccount)
    router.get('accounts', isAuth, accountController.listAccounts)
    router.get('accounts/:id', isAuth, accountController.getAccountById)
    router.post('accounts/fund', isAuth, accountController.fundAccount)

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
    router.use(errorHandler)

    app.use(router)

    return app
  }
}
