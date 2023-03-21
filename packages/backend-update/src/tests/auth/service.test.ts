import { createContainer } from '@/index'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/container'
import { createApp, TestApp } from '../app'
import { Knex } from 'knex'
import { truncateTables } from '../tables'
import { AuthService } from '@/auth/service'
import { faker } from '@faker-js/faker'

describe('Authentication Service', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService

  const args = {
    email: faker.internet.email(),
    password: faker.internet.password()
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Create User', (): void => {
    it('creates a new user', async (): Promise<void> => {
      await expect(authService.createUser(args)).resolves.toMatchObject({
        email: args.email
      })
    })

    it('throws an error if the email is already in use', async (): Promise<void> => {
      await authService.createUser(args)

      await expect(authService.createUser(args)).rejects.toThrowError(
        /Email already in use/
      )
    })
  })

  describe('Authorize', (): void => {
    it('authorizes a user', async (): Promise<void> => {
      const user = await authService.createUser(args)

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

    it('throws an error if the user does not exist', async (): Promise<void> => {
      await expect(authService.authorize(args)).rejects.toThrowError(
        /Invalid credentials/
      )
    })

    it('throws an error if the password is invalid', async (): Promise<void> => {
      await authService.createUser(args)

      await expect(
        authService.authorize({ ...args, password: 'invalid' })
      ).rejects.toThrowError(/Invalid credentials/)
    })
  })
})
