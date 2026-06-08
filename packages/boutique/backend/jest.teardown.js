module.exports = async () => {
  if (global.__POSTGRES_CONTAINER__) {
    await global.__POSTGRES_CONTAINER__.stop()
  }
  if (global.__TESTING_REDIS_CONTAINER__) {
    await global.__TESTING_REDIS_CONTAINER__.stop()
  }
}
