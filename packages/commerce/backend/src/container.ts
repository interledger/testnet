import {
  AwilixContainer,
  InjectionMode,
  asFunction,
  asValue,
  createContainer as createAwilixContainer
} from 'awilix'
import type { Env } from './config/env'
import { type Knex } from 'knex'
import { createKnex } from './config/knex'
import { Logger } from 'winston'
import { createLogger } from './config/logger'

export interface Cradle {
  env: Env
  logger: Logger
  knex: Knex
}

export function createContainer(env: Env): AwilixContainer<Cradle> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  container.register({
    env: asValue(env),
    logger: asFunction(createLogger).singleton(),
    knex: asFunction(createKnex).singleton()
  })

  return container
}
