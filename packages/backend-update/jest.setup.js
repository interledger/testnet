const { PostgreSqlContainer } = require('testcontainers')

module.exports = async (_config) => {
  try {
    const container = await new PostgreSqlContainer('postgres:15')
      .withPassword('password')
      .withExposedPorts(5432)
      .start()

    global.__TESTING_POSTGRES_CONTAINER__ = container
  } catch (e) {
    console.log(e)
  }
}
