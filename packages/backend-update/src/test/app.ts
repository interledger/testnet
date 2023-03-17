import { start } from '@/index'
import { App, Bindings } from '@/app'
import { Container } from '@/container'

export interface TestApp {
  port: number
  stop: () => Promise<void>
}

export const createApp = async (
  container: Container<Bindings>
): Promise<TestApp> => {
  const env = await container.resolve('env')
  env.PORT = 0

  const app = new App(container)
  await start(app)

  return {
    port: app.getPort(),
    stop: app.stop
  }
}
