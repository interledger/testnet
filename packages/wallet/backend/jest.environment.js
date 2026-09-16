const { TestEnvironment: NodeEnvironment } = require('jest-environment-node')

// jest.setup.js starts a Postgres and a Redis container for every test file.
// They must be stopped again per test file, and `teardown()` is the only hook
// that runs late enough: a `globalTeardown` runs in the main Jest process and
// never sees the globals that jest.setup.js sets inside the worker, and an
// `afterAll` from `setupFilesAfterEnv` runs *before* the suites' own
// `afterAll`, which still needs the database to close knex and the app.
//
// Without this the containers stay up for the whole run - dozens at a time -
// and leak entirely whenever the run crashes hard enough to take the
// testcontainers reaper with it.
class WalletBackendEnvironment extends NodeEnvironment {
  async teardown() {
    await this.global.__TESTING_REDIS_CONTAINER__?.stop()
    await this.global.__TESTING_POSTGRES_CONTAINER__?.stop()

    await super.teardown()
  }
}

module.exports = WalletBackendEnvironment
