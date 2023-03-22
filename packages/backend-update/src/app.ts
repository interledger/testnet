import express, {
  Router,
  type Express,
  type NextFunction,
  type Request
} from 'express'
import { Server } from 'http'
import helmet from 'helmet'
import type { Knex } from 'knex'
import type { Logger } from 'winston'
import type { AuthController } from './auth/controller'
import type { AuthService } from './auth/service'
import type { Env } from './config/env'
import type { UserService } from './user/service'
import type { UserController } from './user/controller'
import { Container } from './container'
import { Model } from 'objection'
import { withSession } from './middleware/withSession'
import { errorHandler } from './middleware/errorHandler'

export interface Bindings {
  env: Env
  logger: Logger
  knex: Knex
  userService: UserService
  userController: UserController
  authService: AuthService
  authController: AuthController
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

    // Me Endpoint
    router.get('/me', userController.me)

    // Auth Routes
    router.post('/auth/sign-up', authController.signUp)
    router.post('/auth/log-in', authController.logIn)

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
