const { PostgreSqlContainer } = require('testcontainers')
const { Model } = require('objection')
const knex = require('knex')
const path = require('path')

module.exports = async (globalConfig) => {
  try {
    // export const TEST_TIMEOUTS = 60000
    // jest.setTimeout(60000)

    const container = await new PostgreSqlContainer('postgres:15')
      .withDatabase('testnet')
      .withPassword('password')
      .withUser('postgres')
      .start()

    global.__TESTING_POSTGRES_CONTAINER__ = container

    const pg = knex({
      client: 'pg',
      connection: {
        user: container.getUsername(),
        host: container.getHost(),
        database: container.getDatabase(),
        port: container.getPort(),
        password: container.getPassword(),
        ssl: false
      },
      pool: { min: 3, max: 10 },
      migrations: { directory: path.join(__dirname, 'migrations') },
      debug: false
    })

    await pg.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    await pg.migrate.latest({
      directory: __dirname + '/migrations'
    })

    Model.knex(pg)

    global.__TESTING_KNEX__ = pg
  } catch (e) {
    console.log(e)
  }
}
