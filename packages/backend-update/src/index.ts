import { App, Bindings } from './app'
import { Env, env } from './config/env'
import { logger } from './config/logger'
import { Container } from './container'

export const createContainer = (config: Env): Container<Bindings> => {
  const container = new Container<Bindings>()
  container.register('env', async () => config)
  container.register('logger', async () => logger)
  return container
}

const container = createContainer(env)
const app = new App(container)

export const start = async (app: App): Promise<void> => {
  await app.startServer()
  console.info(`Server listening on port ${app.getPort()}`)
}

if (!module.children) {
  start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
}
