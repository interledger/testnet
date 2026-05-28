const { GenericContainer } = require('testcontainers')
const { randomBytes, generateKeyPairSync } = require('crypto')

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

  // env.ts requires these variables without defaults, so we supply
  // test-safe values here to prevent process.exit(1) during import.
  process.env.PORT = '0'
  process.env.NODE_ENV = 'test'
  process.env.FRONTEND_URL = 'http://localhost:4004'
  process.env.DATABASE_URL = `postgresql://postgres:${POSTGRES_PASSWORD}@localhost:${container.getMappedPort(
    POSTGRES_PORT
  )}/${POSTGRES_DB}`
  process.env.PAYMENT_POINTER = 'https://ilp.interledger-test.dev/boutique'
  process.env.KEY_ID = 'test-key-id'
  process.env.PRIVATE_KEY = Buffer.from(
    generateKeyPairSync('ed25519')
      .privateKey.export({
        format: 'pem',
        type: 'pkcs8'
      })
      .trim()
  ).toString('base64')
  process.env.REDIS_URL = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}/0`

  global.__POSTGRES_CONTAINER__ = container
  global.__TESTING_REDIS_CONTAINER__ = redisContainer
}
