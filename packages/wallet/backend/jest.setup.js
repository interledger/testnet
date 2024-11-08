const { GenericContainer } = require('testcontainers')
const { randomBytes } = require('crypto')

const POSTGRES_PASSWORD = 'password'
const POSTGRES_DB = randomBytes(16).toString('hex')
const POSTGRES_PORT = 5432
const REDIS_PORT = 6379

module.exports = async () => {
  const container = await new GenericContainer('postgres:15')
    .withEnvironment({
      POSTGRES_PASSWORD,
      POSTGRES_DB
    })
    .withExposedPorts(POSTGRES_PORT)
    .start()

  const redisContainer = await new GenericContainer('redis:7')
    .withExposedPorts(REDIS_PORT)
    .start()

  process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}/0`

  process.env.DATABASE_URL = `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${container.getMappedPort(
    POSTGRES_PORT
  )}/${POSTGRES_DB}`

  global.__TESTING_POSTGRES_CONTAINER__ = container
  global.__TESTING_REDIS_CONTAINER__ = redisContainer
}
