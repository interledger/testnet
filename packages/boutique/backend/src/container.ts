import {
  AwilixContainer,
  InjectionMode,
  asClass,
  asFunction,
  asValue,
  createContainer as createAwilixContainer,
  Constructor,
  BuildResolver
} from 'awilix'
import type { Env } from './config/env'
import { type Knex } from 'knex'
import { Logger } from 'winston'
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
import { type OneClickCache, OneClickCacheData } from './cache/one-click'
import { generateLogger } from '@/config/logger'
import { generateKnex } from '@/config/knex'
import { InMemoryCache } from '@shared/backend'

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

  const logger = generateLogger(env)

  const client = await createAuthenticatedClient({
    keyId: env.KEY_ID,
    privateKey: Buffer.from(env.PRIVATE_KEY, 'base64'),
    walletAddressUrl: env.PAYMENT_POINTER,
    useHttp: env.NODE_ENV === 'development'
  })

  container.register({
    env: asValue(env),
    logger: asValue(logger),
    opClient: asValue(client),
    openPayments: asClassSingletonWithLogger(OpenPayments, logger),
    tokenCache: asClassSingletonWithLogger(TokenCache, logger),
    oneClickCache: asClass(InMemoryCache<OneClickCacheData>).singleton(),
    knex: asFunction(generateKnex).singleton(),
    userService: asClass(UserService).singleton(),
    productService: asClassSingletonWithLogger(ProductService, logger),
    orderService: asClassSingletonWithLogger(OrderService, logger),
    productController: asClassSingletonWithLogger(ProductController, logger),
    orderController: asClassSingletonWithLogger(OrderController, logger),
    paymentService: asClassSingletonWithLogger(PaymentService, logger)
  })

  return container
}

function asClassSingletonWithLogger<T>(
  service: Constructor<T>,
  logger: Logger
): BuildResolver<T> {
  return asClass(service)
    .singleton()
    .inject(() => ({
      logger: logger.child({ service: service.name })
    }))
}
