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

  // env.ts requires these GateHub URLs without defaults, so we supply
  // test-safe sandbox values here to prevent process.exit(1) during import.
  process.env.GATEHUB_API_BASE_URL = 'https://api.sandbox.gatehub.net'
  process.env.GATEHUB_IFRAME_MANAGED_RAMP_URL = 'https://managed-ramp.sandbox.gatehub.net'
  process.env.GATEHUB_IFRAME_EXCHANGE_URL = 'https://exchange.sandbox.gatehub.net'
  process.env.GATEHUB_IFRAME_ONBOARDING_URL = 'https://onboarding.sandbox.gatehub.net'

  global.__TESTING_POSTGRES_CONTAINER__ = container
  global.__TESTING_REDIS_CONTAINER__ = redisContainer
}
