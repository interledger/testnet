import { AwilixContainer } from 'awilix'
import { Cradle, createContainer } from '@/createContainer'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import { IncomingPaymentService } from '@/incomingPayment/service'
import { loginUser } from '@/tests/utils'
import { truncateTables } from '@shared/backend/tests'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { mockedListAssets, mockExternalPayment } from '@/tests/mocks'
import { WalletAddress } from '@/walletAddress/model'
import { env } from '@/config/env'
import axios from 'axios'
import { NotFound } from '@shared/backend'

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
      gateHubWalletId: 'mocked'
    })

    const walletAddress = await WalletAddress.query().insert({
      url: faker.internet.url(),
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
      gateHubUserId: 'mocked'
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
    it('should create an incoming payment intent successfully', async () => {
      const created = {
        id: faker.string.uuid(),
        openPaymentsUrl: faker.internet.url()
      }
      const createPaymentIntent = jest.fn().mockResolvedValue(created)
      Reflect.set(incopmPaymentService, 'rhyzaAdminClient', {
        createPaymentIntent
      })

      const { walletAddress } = await prepareIncomePaymentDependencies()
      const result = await incopmPaymentService.create(
        userId,
        walletAddress.url,
        100,
        undefined,
        { description: 'Free Money!' }
      )

      expect(result).toEqual(created)
      expect(createPaymentIntent).toHaveBeenCalledWith({
        walletAddress: walletAddress.url,
        incomingAmount: 100,
        expiresAt: undefined,
        metadata: { description: 'Free Money!' }
      })
    })

    it('should return NotFound if the wallet address does not exist', async () => {
      const createPaymentIntent = jest.fn()
      Reflect.set(incopmPaymentService, 'rhyzaAdminClient', {
        createPaymentIntent
      })

      await expect(
        incopmPaymentService.create(userId, faker.internet.url(), 100)
      ).rejects.toThrowError(NotFound)
      expect(createPaymentIntent).not.toHaveBeenCalled()
    })

    it('should return NotFound if the wallet address belongs to another user', async () => {
      const createPaymentIntent = jest.fn()
      Reflect.set(incopmPaymentService, 'rhyzaAdminClient', {
        createPaymentIntent
      })
      const { walletAddress } = await prepareIncomePaymentDependencies()

      await expect(
        incopmPaymentService.create(faker.string.uuid(), walletAddress.url, 100)
      ).rejects.toThrowError(NotFound)
      expect(createPaymentIntent).not.toHaveBeenCalled()
    })
  })

  describe('Get PaymentDetails By Url', () => {
    const paymentId = faker.string.uuid()
    const url = `${faker.internet.url()}/incoming-payments/${paymentId}`

    it('should get payment details successfully', async () => {
      const getPaymentIntentById = jest.fn().mockResolvedValue({
        id: paymentId,
        incomingAmount: { value: '1000', assetCode: 'USD', assetScale: 2 },
        receivedAmount: { value: '500', assetCode: 'USD', assetScale: 2 }
      })
      Reflect.set(incopmPaymentService, 'rhyzaAdminClient', {
        getPaymentIntentById
      })

      const result = await incopmPaymentService.getPaymentDetailsByUrl(url)

      expect(getPaymentIntentById).toHaveBeenCalledWith(paymentId)
      expect(result).toMatchObject({ assetCode: 'USD', value: 5 })
    })

    it('should return NotFound if the payment intent does not exist', async () => {
      const getPaymentIntentById = jest.fn().mockRejectedValue(new NotFound())
      Reflect.set(incopmPaymentService, 'rhyzaAdminClient', {
        getPaymentIntentById
      })

      await expect(
        incopmPaymentService.getPaymentDetailsByUrl(url)
      ).rejects.toThrowError(NotFound)
      expect(getPaymentIntentById).toHaveBeenCalledWith(paymentId)
    })
  })

  describe('getExternalPayment', () => {
    beforeAll(async (): Promise<void> => {
      axios.get = jest.fn().mockImplementation(() =>
        Promise.resolve({
          data: mockExternalPayment
        })
      )
    })

    it('should return external payment data successfully', async () => {
      const { receivedAmount } = await incopmPaymentService.getExternalPayment(
        faker.internet.url()
      )
      expect(receivedAmount).toMatchObject({
        assetCode: 'EUR',
        assetScale: 1,
        value: '0'
      })
    })
  })
})
