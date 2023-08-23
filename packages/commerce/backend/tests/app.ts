import { start } from '@/index'
import { App } from '@/app'
import { Cradle } from '@/container'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'

export interface TestApp {
  port: number
  knex: Knex
  stop: () => Promise<void>
}

export const createApp = async (
  container: AwilixContainer<Cradle>
): Promise<TestApp> => {
  const env = container.resolve('env')
  const knex = container.resolve('knex')

  env.PORT = 0
  const app = new App(container)
  await start(app)

  return {
    knex,
    port: app.getPort(),
    stop: app.stop
  }
}
