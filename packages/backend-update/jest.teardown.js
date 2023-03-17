module.exports = async () => {
  if (global.__TESTING_POSTGRES_CONTAINER__) {
    await global.__TESTING_POSTGRES_CONTAINER__.stop()
  }
  if (global.__TESTING_KNEX__) {
    await global.__TESTING_KNEX__.rollback(
      {
        directory: __dirname + '/migrations'
      },
      true
    ),
      await global.__TESTING_KNEX__.destroy()
  }
}
