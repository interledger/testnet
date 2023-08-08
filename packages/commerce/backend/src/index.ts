import { createContainer } from './container'
import { env } from './config/env'
import { App } from './app'

const container = createContainer(env)

const app = new App(container)

export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

if (!module.parent) {
  start(app).catch(async (e): Promise<void> => {
    console.log(e)
  })
}
