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
import { BaseError } from './errors/base'
import { Model } from 'objection'
import { isObject } from './shared/utils'
import path from 'path'

export class App {
  private server!: Server

  constructor(private container: AwilixContainer<Cradle>) {}

  public async startServer(): Promise<void> {
    console.log('test')
    const express = await this.init()
    const env = this.container.resolve('env')
    const logger = this.container.resolve('logger')
    const knex = this.container.resolve('knex')

    await knex.migrate.latest({
      directory: __dirname + '/../migrations'
    })

    Model.knex(knex)

    this.server = express.listen(env.PORT)
    logger.info(`Boutique server started on port ${env.PORT}`)
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
    const productController = this.container.resolve('productController')
    const orderController = this.container.resolve('orderController')

    app.use(
      cors({
        origin: [env.FRONTEND_URL],
        credentials: true
      })
    )

    app.use(
      helmet({
        crossOriginResourcePolicy: false
      })
    )
    app.use(express.json())
    app.use(express.urlencoded({ extended: true, limit: '25mb' }))
    app.use(
      '/images',
      express.static(path.join(__dirname, '..', 'images'), {
        maxAge: 31536000
      })
    )

    router.get('/products', productController.list.bind(productController))
    router.get('/products/:slug', productController.get.bind(productController))

    router.post('/orders', orderController.create.bind(orderController))
    router.post(
      '/orders/instant-buy',
      orderController.instantBuy.bind(orderController)
    )
    router.post(
      '/orders/setup-one-click',
      orderController.setup.bind(orderController)
    )
    router.post(
      '/orders/setup-one-click/finish',
      orderController.setupFinish.bind(orderController)
    )
    router.patch('/orders/:id', orderController.finish.bind(orderController))

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

  public errorHandler(
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
      const message = isObject(e) ? e.message : 'unknown error'
      logger.error(message)
      logger.error(e)
      res.status(500).json({ success: false, message: 'Internal Server Error' })
    }
  }

  private async processPendingPayments() {
    const paymentService = this.container.resolve('paymentService')
    const logger = this.container.resolve('logger')
    return paymentService
      .processPendingPayments()
      .catch((err) => {
        logger.error('Error while trying to process pending payments')
        logger.error(err)
        return true
      })
      .then((trx) => {
        if (trx) {
          process.nextTick(() => this.processPendingPayments())
        } else {
          setTimeout(() => this.processPendingPayments(), 5000).unref()
        }
      })
  }

  private async processOneClickCache() {
    const oneClickCache = this.container.resolve('oneClickCache')
    oneClickCache.processExpired()
    setTimeout(() => this.processOneClickCache(), 5000).unref()
  }

  async processResources() {
    process.nextTick(() => this.processPendingPayments())
    process.nextTick(() => this.processOneClickCache())
  }
}
