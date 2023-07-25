import { createContainer } from '@/createContainer'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/shared/container'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@/tests/tables'
import type { AuthService } from '@/auth/service'
import type { UserService } from '@/user/service'
import { mockLogInRequest } from '../mocks'
import { getRandomToken } from '@/utils/helpers'

describe('Authentication Service', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userService: UserService

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    userService = await bindings.resolve('userService')
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Authorize', (): void => {
    it('should authorize a user', async (): Promise<void> => {
      const args = mockLogInRequest().body
      const user = await userService.create({
        ...args,
        verifyEmailToken: getRandomToken()
      })

      await expect(authService.authorize(args)).resolves.toMatchObject({
        session: {
          userId: user.id
        },
        user: {
          id: user.id,
          email: user.email
        }
      })
    })

    it('should throw an error if the user does not exist', async (): Promise<void> => {
      await expect(
        authService.authorize(mockLogInRequest().body)
      ).rejects.toThrowError(/Invalid credentials/)
    })

    it('should throw an error if the password is invalid', async (): Promise<void> => {
      const args = mockLogInRequest().body
      await userService.create({ ...args, verifyEmailToken: getRandomToken() })

      await expect(
        authService.authorize({ ...args, password: 'invalid' })
      ).rejects.toThrowError(/Invalid credentials/)
    })
  })
})
