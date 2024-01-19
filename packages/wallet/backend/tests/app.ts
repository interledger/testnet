import { start } from '@/index'
import { App } from '@/app'
import { Knex } from 'knex'
import { AwilixContainer } from 'awilix'
import { Cradle } from '@/createContainer'

export interface TestApp {
  knex: Knex
  port: number
  stop: () => Promise<void>
}

export const createApp = async (
  container: AwilixContainer<Cradle>
): Promise<TestApp> => {
  console.log('test2')
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
