module.exports = async () => {
  if (global.__POSTGRES_CONTAINER__) {
    await global.__POSTGRES_CONTAINER__.stop()
  }
}
