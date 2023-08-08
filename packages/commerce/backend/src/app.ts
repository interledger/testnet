import { AwilixContainer } from 'awilix'
import cors from 'cors'
import express, {
  Router,
  type Express,
  type Request,
  NextFunction
} from 'express'
import helmet from 'helmet'
import type { Server } from 'http'
import type { Cradle } from './container'
import { BaseError } from './errors/Base'

export class App {
  private server!: Server

  constructor(private container: AwilixContainer<Cradle>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = this.container.resolve('env')

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

  // TODO: Rate limiting
  private async init(): Promise<Express> {
    const app = express()
    const router = Router()

    const env = this.container.resolve('env')

    app.use(
      cors({
        origin: ['http://localhost:4004'],
        credentials: true
      })
    )

    app.use(helmet())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))

    router.use('*', (req: Request, res: TypedResponse) => {
      const e = Error(`Requested path ${req.path} was not found`)

      res.status(404).send({
        success: false,
        message: e.message,
        stack: env.NODE_ENV === 'development' ? e.stack : undefined
      })
    })

    router.use(this.errorHandler)

    app.use(router)

    return app
  }

  private errorHandler(
    e: Error,
    _req: Request,
    res: TypedResponse,
    _next: NextFunction
  ) {
    if (e instanceof BaseError) {
      res.status(e.statusCode).json({
        success: e.success,
        message: e.message,
        errors: e.errors
      })
    } else {
      res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
  }
}
