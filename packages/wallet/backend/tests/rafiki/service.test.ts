import { Bindings } from '@/app'
import { env } from '@/config/env'
import { createContainer } from '@/createContainer'
import { RafikiService } from '@/rafiki/service'
import { Container } from '@/shared/container'
import { Knex } from 'knex'
import { TestApp, createApp } from '../app'
import { truncateTables } from '../tables'
import { mockOutgoingPaymenteCreatedEvent } from '../mocks'

describe('Rafiki Service', () => {
  let bindings: Container<Bindings>
  let knex: Knex
  let rafikiService: RafikiService
  let appContainer: TestApp

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    rafikiService = await bindings.resolve('rafikiService')
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('OnWebHook', () => {
    it('should throw an error if the paymentPointer is invalid', async () => {
      const webHook = mockOutgoingPaymenteCreatedEvent({})

      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /Invalid payment pointer/
      )
    })
  })
})
