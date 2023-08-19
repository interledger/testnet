module.exports = async () => {
  if (global.__TESTING_POSTGRES_CONTAINER__) {
    await global.__TESTING_POSTGRES_CONTAINER__.stop()
  }
}
