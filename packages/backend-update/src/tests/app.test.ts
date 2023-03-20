import { createContainer } from '@/index'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/container'
import { createApp, TestApp } from './app'

describe('Application', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
  })

  test('1 equals 1', (): void => {
    expect(1).toEqual(1)
  })
})
