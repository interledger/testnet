import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@/tests/tables'
import type { AuthService } from '@/auth/service'
import { fakeLoginData, mockLogInRequest } from '../mocks'
import { createUser } from '../helpers'
import { AwilixContainer } from 'awilix'

describe('Authentication Service', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Authorize', (): void => {
    it('should authorize a user', async (): Promise<void> => {
      const newUserData = {
        ...fakeLoginData(),
        isEmailVerified: true
      }
      const user = await createUser(newUserData)

      await expect(authService.authorize(newUserData)).resolves.toMatchObject({
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
      const args = fakeLoginData()
      await createUser(args)

      await expect(
        authService.authorize({ ...args, password: 'invalid' })
      ).rejects.toThrowError(/Invalid credentials/)
    })

    it('should throw an error if email is invalid', async (): Promise<void> => {
      const args = fakeLoginData()
      await createUser(args)

      await expect(authService.authorize(args)).rejects.toThrowError(
        /Email address is not verified/
      )
    })
  })
})
