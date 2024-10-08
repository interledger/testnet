import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import { faker } from '@faker-js/faker'
import type { UserService } from '@/user/service'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { AwilixContainer } from 'awilix'
import { GateHubClient } from '@/gatehub/client'
import { mockGateHubClient } from '@/tests/mocks'

describe('User Service', (): void => {
  let bindings: AwilixContainer<Cradle>
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
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    userService = await bindings.resolve('userService')

    // Mock GateHubClient required methods in UserService
    Reflect.set(
      userService,
      'gateHubClient',
      mockGateHubClient as unknown as GateHubClient
    )
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
