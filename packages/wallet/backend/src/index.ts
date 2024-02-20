import { App } from './app'
import { env } from './config/env'
import { createContainer } from '@/createContainer'

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString()
}
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
  await app.createDefaultUsers()
}

if (!module.parent) {
  bootstrap()
}
