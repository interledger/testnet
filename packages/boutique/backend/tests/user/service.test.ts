import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { IUserService } from '@/user/service'
import { truncateTables } from '@/tests/tables'
import { randomUUID } from 'crypto'

describe('Product Service', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let userService: IUserService

  const walletAddress = 'https://ilp.example.com'

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    userService = container.resolve('userService')
  })

  afterAll(async (): Promise<void> => {
    console.log('test')
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('create', (): void => {
    it('should create a new user', async (): Promise<void> => {
      await expect(userService.create(walletAddress)).resolves.toMatchObject({
        walletAddress
      })
    })

    it('should throw an error when trying to create a new user with an already existing payment pointer', async (): Promise<void> => {
      await userService.create(walletAddress)
      await expect(userService.create(walletAddress)).rejects.toThrowError(
        /value violates unique constraint/
      )
    })
  })

  describe('get', (): void => {
    it('should return undefined if the user ID does not exist', async (): Promise<void> => {
      await expect(userService.get('id', randomUUID())).resolves.toBeUndefined()
    })

    it('should return undefined if the user with the given payment pointer does not exist', async (): Promise<void> => {
      await expect(
        userService.get('walletAddress', walletAddress)
      ).resolves.toBeUndefined()
    })
  })
})
