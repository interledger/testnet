import axios, { AxiosError } from 'axios'
import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { createApp, TestApp } from './app'
import { AwilixContainer } from 'awilix'

describe('Application', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await app.knex.destroy()
  })

  it('should return status 404 if the route does not exist', async (): Promise<void> => {
    try {
      await axios.post(`http://localhost:${app.port}/`, {
        json: {
          a: 'b'
        }
      })
    } catch (e) {
      expect((e as AxiosError).response?.status).toBe(404)
    }
  })
})
