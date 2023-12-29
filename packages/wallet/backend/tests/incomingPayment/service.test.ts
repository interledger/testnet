import { AwilixContainer } from 'awilix'
import { Cradle, createContainer } from '@/createContainer'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@/tests/tables'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { generateMockedTransaction, mockedListAssets } from '@/tests/mocks'
import { WalletAddress } from '@/walletAddress/model'
import { env } from '@/config/env'
import { NotFound } from '@/errors'
import { Transaction } from '@/transaction/model'
import axios from 'axios'

describe('Incoming Payment Service', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let incopmPaymentService: IncomingPaymentService
  let userId: string

  const prepareIncomePaymentDependencies = async () => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
      assetCode: mockedListAssets[0].code,
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      virtualAccountId: 'mocked'
    })

    const walletAddress = await WalletAddress.query().insert({
      url: faker.string.alpha(10),
      publicName: faker.string.alpha(10),
      accountId: account.id,
      id: faker.string.uuid()
    })

    return {
      account,
      walletAddress
    }
  }

  const mockIncomePaymentDeps = async (receiverID?: string) => {
    const IncomePaymentDepsMocked = {
      accountService: await bindings.resolve('accountService'),
      logger: await bindings.resolve('logger'),
      env: await bindings.resolve('env'),
      rafikiClient: {
        getAssetById: (id: unknown) =>
          mockedListAssets.find((asset) => asset.id === id),
        createReceiver: () => ({
          id: receiverID || faker.string.uuid(),
          walletAddressUrl: faker.internet.url(),
          completed: true
        })
      }
    }

    for (const key in IncomePaymentDepsMocked)
      Reflect.set(
        incopmPaymentService,
        key,
        IncomePaymentDepsMocked[key as keyof typeof IncomePaymentDepsMocked]
      )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    incopmPaymentService = await bindings.resolve('incomingPaymentService')

    await mockIncomePaymentDeps()
  })

  beforeEach(async (): Promise<void> => {
    const extraUserArgs = {
      isEmailVerified: true,
      rapydWalletId: 'mocked'
    }

    const { user } = await loginUser({
      authService,
      extraUserArgs
    })
    userId = user.id
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Create', () => {
    it('should create an IncomePayment successfully', async () => {
      const createdId = faker.string.uuid()
      await mockIncomePaymentDeps(createdId)
      const { walletAddress } = await prepareIncomePaymentDependencies()
      const result = await incopmPaymentService.create(
        userId,
        walletAddress.id,
        100
      )
      expect(result).toEqual(createdId)
    })

    it('should return NotFound Err', async () => {
      await expect(
        incopmPaymentService.create(userId, faker.string.uuid(), 100)
      ).rejects.toThrowError(NotFound)
    })
  })

  describe('Get PaymentDetails By Url', () => {
    it('should get payment details successfully', async () => {
      const { walletAddress, account } =
        await prepareIncomePaymentDependencies()
      const paymentId = faker.string.uuid()
      const transaction = await Transaction.query().insert(
        generateMockedTransaction({
          walletAddressId: walletAddress.id,
          accountId: account.id,
          paymentId
        })
      )
      const url = `${faker.internet.url()}/${paymentId}`
      const result = await incopmPaymentService.getPaymentDetailsByUrl(url)
      expect(result).toMatchObject({
        description: transaction.description,
        assetCode: transaction.assetCode
      })
    })

    it('should throw err with wrong payment id', async () => {
      const { walletAddress, account } =
        await prepareIncomePaymentDependencies()
      await Transaction.query().insert(
        generateMockedTransaction({
          walletAddressId: walletAddress.id,
          accountId: account.id
        })
      )
      const url = `${faker.internet.url()}/${faker.string.uuid()}`
      await expect(
        incopmPaymentService.getPaymentDetailsByUrl(url)
      ).rejects.toThrowError(
        /The provided incoming payment URL could not be found./
      )
    })
  })
  describe('getExternalPayment', () => {
    beforeAll(async (): Promise<void> => {
      axios.get = jest.fn().mockImplementation(() =>
        Promise.resolve({
          data: {
            receivedAmount: {
              assetCode: 'BRG',
              assetScale: 3,
              value: 0
            }
          }
        })
      )
    })

    it('should return external payment data successfully', async () => {
      const result = await incopmPaymentService.getExternalPayment(
        faker.internet.url()
      )
      expect(result).toMatchObject({
        receivedAmount: {
          assetCode: 'BRG',
          assetScale: 3,
          value: 0
        }
      })
    })
  })
})
