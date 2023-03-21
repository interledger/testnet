import { createContainer } from '@/index'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/container'
import { createApp, TestApp } from './app'
import { Knex } from 'knex'

describe('Application', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  test('1 equals 1', (): void => {
    expect(1).toEqual(1)
  })
})
