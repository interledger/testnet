import { start } from '@/index'
import { App, Bindings } from '@/app'
import { Container } from '@/shared/container'
import { Knex } from 'knex'
import { RafikiClient } from '@/rafiki/rafiki-client'

export interface TestApp {
  knex: Knex
  rafikiClient: RafikiClient
  port: number
  stop: () => Promise<void>
}

export const createApp = async (
  container: Container<Bindings>
): Promise<TestApp> => {
  const env = await container.resolve('env')
  const knex = await container.resolve('knex')
  const rafikiClient = await container.resolve('rafikiClient')

  env.PORT = 0
  const app = new App(container)
  await start(app)

  return {
    knex,
    rafikiClient,
    port: app.getPort(),
    stop: app.stop
  }
}
