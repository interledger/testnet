const { GenericContainer } = require('testcontainers')
const { randomBytes } = require('crypto')

const POSTGRES_PASSWORD = 'password'
const POSTGRES_DB = randomBytes(16).toString('hex')
const POSTGRES_PORT = 5432

module.exports = async () => {
  const container = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_PASSWORD,
      POSTGRES_DB
    })
    .withExposedPorts(POSTGRES_PORT)
    .start()

  process.env.DATABASE_URL = `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${container.getMappedPort(
    POSTGRES_PORT
  )}/${POSTGRES_DB}`

  global.__POSTGRES_CONTAINER__ = container
}
