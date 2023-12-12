module.exports = async () => {
  if (global.__TESTING_POSTGRES_CONTAINER__) {
    await global.__TESTING_POSTGRES_CONTAINER__.stop()
    await global.__TESTING_REDIS_CONTAINER__.stop()
  }
}
