import {
  AwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
  createContainer as createAwilixContainer
} from 'awilix'
import type { Env } from './config/env'
import { type Knex } from 'knex'
import { createKnex } from './config/knex'
import { Logger } from 'winston'
import { createLogger } from './config/logger'
import { ProductService, type IProductService } from './product/service'
import { OrderService, type IOrderService } from './order/service'
import { UserService, type IUserService } from './user/service'
import { IProductController, ProductController } from './product/controller'
import { IOrderController, OrderController } from './order/controller'
import {
  AuthenticatedClient,
  createAuthenticatedClient
} from '@interledger/open-payments'
import { IOpenPayments, OpenPayments } from './open-payments/service'
import { TokenCache } from './cache/token'
import { IPaymentService, PaymentService } from './payment/service'
import { InMemoryCache } from './cache/in-memory'
import { OneClickCacheData, type OneClickCache } from './cache/one-click'

export interface Cradle {
  env: Env
  logger: Logger
  knex: Knex
  opClient: AuthenticatedClient
  oneClickCache: OneClickCache
  tokenCache: TokenCache
  openPayments: IOpenPayments
  userService: IUserService
  productService: IProductService
  orderService: IOrderService
  productController: IProductController
  orderController: IOrderController
  paymentService: IPaymentService
}

export async function createContainer(
  env: Env
): Promise<AwilixContainer<Cradle>> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  const client = await createAuthenticatedClient({
    keyId: env.KEY_ID,
    privateKey: Buffer.from(env.PRIVATE_KEY, 'base64'),
    paymentPointerUrl: env.PAYMENT_POINTER
  })

  container.register({
    env: asValue(env),
    logger: asFunction(createLogger).singleton(),
    opClient: asValue(client),
    openPayments: asClass(OpenPayments).singleton(),
    tokenCache: asClass(TokenCache).singleton(),
    oneClickCache: asClass(InMemoryCache<OneClickCacheData>),
    knex: asFunction(createKnex).singleton(),
    userService: asClass(UserService).singleton(),
    productService: asClass(ProductService).singleton(),
    orderService: asClass(OrderService).singleton(),
    productController: asClass(ProductController).singleton(),
    orderController: asClass(OrderController).singleton(),
    paymentService: asClass(PaymentService).singleton()
  })

  return container
}
