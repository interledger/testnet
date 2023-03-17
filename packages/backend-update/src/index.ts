import { App, Bindings } from './app'
import { env } from './config/env'
import { logger } from './config/logger'
import { Container } from './container'

const container = new Container<Bindings>()

container.register('env', async () => env)
container.register('logger', async () => logger)

const app = new App(container)

const start = async (app: App): Promise<void> => {
  await app.startServer()
  console.info(`Server listening on port ${app.getPort()}`)
}

start(app).catch(async (e): Promise<void> => {
  console.log(e)
})
