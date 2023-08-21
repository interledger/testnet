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
import { Model } from 'objection'
import { isObject } from './shared/utils'
import { z } from 'zod'
import { BadRequest, NotFound } from './errors'

interface FileHandlerParams {
  productId: string
}

export class App {
  private server!: Server

  constructor(private container: AwilixContainer<Cradle>) {}

  public async startServer(): Promise<void> {
    const express = await this.init()
    const env = this.container.resolve('env')
    const logger = this.container.resolve('logger')
    const knex = this.container.resolve('knex')

    await knex.migrate.latest({
      directory: __dirname + '/../migrations'
    })

    Model.knex(knex)

    this.server = express.listen(env.PORT)
    logger.info(`Commerce server started on port ${env.PORT}`)
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

    router.get('/images/:productId', this.fileHandler.bind(this))

    router.use('*', (req: Request, res: TypedResponse) => {
      const e = Error(`Requested path ${req.path} was not found.`)

      res.status(404).send({
        success: false,
        message: e.message,
        stack: env.NODE_ENV === 'development' ? e.stack : undefined
      })
    })

    router.use(this.errorHandler.bind(this))

    app.use(router)

    return app
  }

  private errorHandler(
    e: Error,
    _req: Request,
    res: TypedResponse,
    _next: NextFunction
  ) {
    const logger = this.container.resolve('logger')

    if (e instanceof BaseError) {
      res.status(e.statusCode).json({
        success: e.success,
        message: e.message,
        errors: e.errors
      })
    } else {
      logger.error((isObject(e) ? e.message : undefined) ?? 'unknown error')
      res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
  }

  private async fileHandler(
    req: Request<FileHandlerParams>,
    res: TypedResponse,
    next: NextFunction
  ) {
    try {
      const result = z.string().uuid().safeParse(req.params.productId)
      if (!result.success) throw new BadRequest('Invalid product ID.')

      const productService = this.container.resolve('productService')
      const product = await productService.get(result.data)
      if (!product) throw new NotFound('Product not found')

      const buffer = Buffer.from(product.image, 'base64')
      res
        .setHeader('Content-Type', 'image/png')
        .setHeader('Cache-Control', 'max-age=31536000')
        .send(buffer)
    } catch (err) {
      next(err)
    }
  }
}
