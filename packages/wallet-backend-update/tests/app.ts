import { start } from '@/index'
import { App, Bindings } from '@/app'
import { Container } from '@/container'
import { Knex } from 'knex'

export interface TestApp {
  knex: Knex
  port: number
  stop: () => Promise<void>
}

export const createApp = async (
  container: Container<Bindings>
): Promise<TestApp> => {
  const env = await container.resolve('env')
  const knex = await container.resolve('knex')

  env.PORT = 0
  const app = new App(container)
  await start(app)

  return {
    knex,
    port: app.getPort(),
    stop: app.stop
  }
}
