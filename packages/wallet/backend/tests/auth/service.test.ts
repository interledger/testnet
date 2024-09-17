import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import type { AuthService } from '@/auth/service'
import { fakeLoginData, mockLogInRequest } from '../mocks'
import { createUser } from '../helpers'
import { AwilixContainer } from 'awilix'
import { faker } from '@faker-js/faker'
import { uuid } from '@/tests/utils'

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
  describe('SignUp', () => {
    it('should sign up user', async () => {
      const dto = {
        email: faker.internet.email(),
        password: faker.lorem.slug()
      }
      const user = await authService.signUp(dto)
      expect(user).toMatchObject({
        id: user.id,
        email: user.email
      })
    })

    it('should return unexpected error', async () => {
      jest
        .spyOn(authService, 'signUp')
        .mockRejectedValueOnce(new Error('Unexpected error'))

      const dto = {
        email: faker.internet.email(),
        password: faker.lorem.slug()
      }
      await expect(authService.signUp(dto)).rejects.toThrowError(
        /Unexpected error/
      )
    })
  })

  describe('Logout', () => {
    it('should return undefined if user successfully logout', async () => {
      const newUserData = {
        ...fakeLoginData(),
        isEmailVerified: true
      }
      const user = await createUser(newUserData)
      await authService.authorize(newUserData)
      const result = await authService.logout(user.id)
      expect(result).toBeUndefined()
    })
  })

  describe('ResendVerifyEmail', () => {
    it('should return undefined if verification email successfully sent', async () => {
      const newUserData = {
        ...fakeLoginData(),
        isEmailVerified: false
      }
      await createUser(newUserData)

      const userData = {
        email: newUserData.email
      }

      await expect(
        authService.resendVerifyEmail(userData)
      ).resolves.toBeUndefined()
    })

    it('should not throw an error if the user does not exist', async (): Promise<void> => {
      await expect(
        authService.resendVerifyEmail(mockLogInRequest().body)
      ).resolves.toBeUndefined()
    })
  })

  it('should return err with wrong credentials', async () => {
    await expect(authService.logout(uuid())).rejects.toThrowError(
      /Invalid credentials/
    )
  })
})
