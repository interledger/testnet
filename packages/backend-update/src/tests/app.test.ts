import axios, { AxiosError } from 'axios'
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

  it('returns status 415 if the content type is not application/json', async (): Promise<void> => {
    try {
      await axios.get(`http://localhost:${appContainer.port}/`, {
        headers: {
          'Content-Type': 'application/xml'
        }
      })
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(415)
    }
  })

  it('returns status 404 if the route does not exist', async (): Promise<void> => {
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
