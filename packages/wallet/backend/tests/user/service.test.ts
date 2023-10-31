import { createContainer } from '@/createContainer'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/shared/container'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@/tests/tables'
import { faker } from '@faker-js/faker'
import type { UserService } from '@/user/service'
import { getRandomToken, hashToken } from '@/utils/helpers'

describe('User Service', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let userService: UserService
  const emailToken = getRandomToken()

  const args = {
    email: faker.internet.email(),
    password: faker.internet.password()
  }

  const createUserArgs = {
    ...args,
    verifyEmailToken: hashToken(emailToken)
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    userService = await bindings.resolve('userService')
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('create', (): void => {
    it('should create a new user', async (): Promise<void> => {
      await expect(userService.create(createUserArgs)).resolves.toMatchObject({
        email: args.email
      })
    })

    it('should throw an error if the email is already in use', async (): Promise<void> => {
      await userService.create(createUserArgs)

      await expect(userService.create(createUserArgs)).rejects.toThrowError(
        /Email already in use/
      )
    })
  })

  describe('getById', (): void => {
    it('should fetch an user by id', async (): Promise<void> => {
      const user = await userService.create(createUserArgs)

      await expect(userService.getById(user.id)).resolves.toMatchObject({
        email: args.email
      })
    })
  })

  describe('verifyEmail', (): void => {
    it('should return undefined', async () => {
      await userService.create(createUserArgs)

      const result = await userService.verifyEmail(emailToken)
      expect(result).toBeUndefined()
    })
  })
})
