import { App } from './app'
import { env } from './config/env'
import { createContainer } from '@/createContainer'
import console from 'console'
import process from 'process'

BigInt.prototype.toJSON = function (this: bigint) {
  return this.toString()
}
export const start = async (app: App): Promise<void> => {
  await app.startServer()
}

async function bootstrap() {
  const container = await createContainer(env)
  const app = new App(container)

  try {
    await start(app)

    await app.processResources()
  } catch (e) {
    console.log('Error on starting the app')
    console.log(e)
    process.exit(1)
  }
}

if (!module.parent) {
  bootstrap()
}
