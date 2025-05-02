import { AwilixContainer } from 'awilix'
import cors from 'cors'
import express, { type Express, type Request, Router } from 'express'
import helmet from 'helmet'
import type { Server } from 'http'
import type { Cradle } from './container'
import { Model } from 'objection'
import { initErrorHandler } from '@shared/backend'
import path from 'path'

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
    const logger = this.container.resolve('logger')
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

    router.get('/products', productController.list)
    router.get('/products/:slug', productController.get)

    router.post('/orders', orderController.create)
    router.post('/orders/instant-buy', orderController.instantBuy)
    router.post('/orders/setup-one-click', orderController.setup)
    router.post('/orders/setup-one-click/finish', orderController.setupFinish)
    router.patch('/orders/:id', orderController.finish)
    router.get('/orders/:id', orderController.get)

    router.use('*', (req: Request, res: TypedResponse) => {
      const e = Error(`Requested path ${req.path} was not found.`)

      res.status(404).send({
        success: false,
        message: e.message,
        stack: env.NODE_ENV === 'development' ? e.stack : undefined
      })
    })

    router.use(initErrorHandler(logger))

    app.use(router)

    return app
  }

  private async processPendingPayments() {
    const paymentService = this.container.resolve('paymentService')
    const logger = this.container.resolve('logger')
    return paymentService
      .processPendingPayments()
      .catch((err) => {
        logger.error('Error while trying to process pending payments')
        logger.error(err)
        return false
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
