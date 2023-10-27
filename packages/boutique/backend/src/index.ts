import { createContainer } from './container'
import { env } from './config/env'
import { App } from './app'

export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

async function bootstrap() {
  const container = await createContainer(env)
  const app = new App(container)
  await start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
  await app.processResources()
}

if (!module.parent) {
  bootstrap()
}
