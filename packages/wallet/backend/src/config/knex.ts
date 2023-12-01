import { Env } from '@/config/env'
import knex from 'knex'

export function createKnex(env: Env) {
  const _knex = knex({
    client: 'postgresql',
    connection: env.DATABASE_URL,
    migrations: {
      directory: './',
      tableName: 'knex_migrations'
    }
  })

  _knex.client.driver.types.setTypeParser(
    _knex.client.driver.types.builtins.INT8,
    'text',
    BigInt
  )
  return _knex
}
