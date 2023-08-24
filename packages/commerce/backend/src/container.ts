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

export interface Cradle {
  env: Env
  logger: Logger
  knex: Knex
  userService: IUserService
  productService: IProductService
  orderService: IOrderService
  productController: IProductController
  orderController: IOrderController
}

export function createContainer(env: Env): AwilixContainer<Cradle> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  container.register({
    env: asValue(env),
    logger: asFunction(createLogger).singleton(),
    knex: asFunction(createKnex).singleton(),
    userService: asClass(UserService).singleton(),
    productService: asClass(ProductService).singleton(),
    orderService: asClass(OrderService).singleton(),
    productController: asClass(ProductController).singleton(),
    orderController: asClass(OrderController).singleton()
  })

  return container
}
