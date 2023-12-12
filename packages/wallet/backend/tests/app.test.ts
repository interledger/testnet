import axios, { AxiosError } from 'axios'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from './app'
import type { Knex } from 'knex'
import { AwilixContainer } from 'awilix'

describe('Application', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  it('should return status 404 if the route does not exist', async (): Promise<void> => {
    try {
      await axios.post(`http://localhost:${appContainer.port}/`, {
        json: {
          a: 'b'
        }
      })
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(404)
    }
  })
})
