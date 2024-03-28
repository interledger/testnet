import knex from 'knex'
import { Env } from './env'

export function createKnex(env: Env) {
  console.log('database_url', env.DATABASE_URL)
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
