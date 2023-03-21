import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response
} from 'express'
import { Server } from 'http'
import helmet from 'helmet'
import type { Knex } from 'knex'
import type { Logger } from 'winston'
import type { AuthController } from './auth/controller'
import type { AuthRouter } from './auth/router'
import type { AuthService } from './auth/service'
import type { Env } from './config/env'
import type { UserService } from './user/service'
import { Container } from './container'
import { Model } from 'objection'
import { withSession } from './middleware/withSession'
import { BaseError } from './errors/Base'

export interface Bindings {
  env: Env
  logger: Logger
  knex: Knex
  userService: UserService
  authService: AuthService
  authController: AuthController
  authRouter: AuthRouter
}

export class App {
  private server!: Server

  constructor(private container: Container<Bindings>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = await this.container.resolve('env')
    const knex = await this.container.resolve('knex')

    await knex.migrate.latest({
      directory: __dirname + '/../migrations'
    })
    Model.knex(knex)

    this.server = express.listen(env.PORT)
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

  private async init(): Promise<Express> {
    const app = express()

    const env = await this.container.resolve('env')
    const logger = await this.container.resolve('logger')
    const authRouter = await this.container.resolve('authRouter')

    app.use(helmet())

    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))
    app.use(withSession)

    app.use('/auth', authRouter.router)
    app.get('/', (_req: Request, res: Response) => {
      res.json({
        id: _req.session.id,
        user: _req.session.user
      })
    })

    app.use('*', (req: Request, res: Response) => {
      const e = Error(`Requested path ${req.path} was not found`)

      res.status(404).send({
        success: false,
        message: e.name,
        stack: env.NODE_ENV === 'development' ? e.stack : undefined
      })
    })

    app.use((e: Error, _req: Request, res: Response, _next: NextFunction) => {
      if (e instanceof BaseError) {
        res.status(e.statusCode).json({
          success: e.success,
          message: e.message,
          errors: e.errors
        })
      } else {
        logger.error(e)
        res
          .status(500)
          .json({ success: false, message: 'Internal Server Error' })
      }
    })

    return app
  }
}
