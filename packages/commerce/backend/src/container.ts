import {
  AwilixContainer,
  InjectionMode,
  asFunction,
  asValue,
  createContainer as createAwilixContainer
} from 'awilix'
import type { Env } from './config/env'
import knex, { type Knex } from 'knex'

export interface Cradle {
  env: Env
  knex: Knex
}

function createKnex(env: Env) {
  const _knex = knex({
    client: 'postgresql',
    connection: env.DATABASE_URL,
    migrations: {
      directory: './',
      tableName: 'knex_migrations'
    }
  })
  console.log('creating knex ...')
  _knex.client.driver.types.setTypeParser(
    _knex.client.driver.types.builtins.INT8,
    'text',
    BigInt
  )

  return _knex
}

export function createContainer(env: Env): AwilixContainer<Cradle> {
  const container = createAwilixContainer<Cradle>({
    injectionMode: InjectionMode.CLASSIC
  })

  container.register({
    env: asValue(env),
    knex: asFunction(createKnex).singleton()
  })

  return container
}
