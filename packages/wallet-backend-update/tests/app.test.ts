import axios, { AxiosError } from 'axios'
import { createContainer } from '@/createContainer'
import type { Bindings } from '@/app'
import { env } from '@/config/env'
import type { Container } from '@/shared/container'
import { createApp, TestApp } from './app'
import type { Knex } from 'knex'

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
