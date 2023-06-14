import { App } from './app'
import { env } from './config/env'
import { createContainer } from './createContainer'

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString()
}

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
