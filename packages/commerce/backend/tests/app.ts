import { start } from '@/index'
import { App } from '@/app'
import { Cradle } from '@/container'
import { AwilixContainer } from 'awilix'

export interface TestApp {
  port: number
  stop: () => Promise<void>
}

export const createApp = async (
  container: AwilixContainer<Cradle>
): Promise<TestApp> => {
  const env = container.resolve('env')

  env.PORT = 0
  const app = new App(container)
  await start(app)

  return {
    port: app.getPort(),
    stop: app.stop
  }
}
