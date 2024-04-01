import knex from 'knex'

export function createKnex(databaseUrl: string) {
  const _knex = knex({
    client: 'postgresql',
    connection: databaseUrl,
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
