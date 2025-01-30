import { env } from '@/config/env'
import { Cradle, createContainer } from '@/createContainer'
import { RafikiService } from '@/rafiki/service'
import { Knex } from 'knex'
import { createApp, TestApp } from '../app'
import {
  mockedListAssets,
  mockOutgoingPaymentCompletedEvent,
  mockOutgoingPaymentCreatedEvent,
  mockOutgoingPaymentFailedEvent,
  mockWalletAddress
} from '../mocks'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Account } from '@/account/model'
import { faker } from '@faker-js/faker'
import { WalletAddress } from '@/walletAddress/model'
import { loginUser } from '@/tests/utils'
import type { AuthService } from '@/auth/service'

describe('Rafiki Service', () => {
  let bindings: AwilixContainer<Cradle>
  let knex: Knex
  let rafikiService: RafikiService
  let authService: AuthService
  let appContainer: TestApp
  let userId: string

  const prepareRafikiDependencies = async () => {
    const account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId,
      assetCode: mockedListAssets[0].code,
      assetId: mockedListAssets[0].id,
      assetScale: mockedListAssets[0].scale,
      gateHubWalletId: 'mocked'
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

  const createMockRafikiServiceDeps = (walletAddress?: WalletAddress) => {
    const rafikiServiceDepsMocked = {
      userService: {},
      rafikiClient: {
        depositLiquidity: jest.fn(),
        createOutgoingTransaction: jest.fn()
      },
      socketService: {},
      transactionService: {
        createOutgoingTransaction: jest.fn()
      },
      walletAddressService: {
        findByIdWithoutValidation: () => walletAddress || mockWalletAddress
      },
      env: bindings.resolve('env'),
      logger: bindings.resolve('logger')
    }

    for (const key in rafikiServiceDepsMocked)
      Reflect.set(
        rafikiService,
        key,
        rafikiServiceDepsMocked[key as keyof typeof rafikiServiceDepsMocked]
      )
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    rafikiService = await bindings.resolve('rafikiService')
    createMockRafikiServiceDeps()
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
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('OnWebHook', () => {
    it('should call outgoing payment created successfully', async () => {
      const { walletAddress } = await prepareRafikiDependencies()

      createMockRafikiServiceDeps(walletAddress)

      const webHook = mockOutgoingPaymentCreatedEvent({})

      const result = await rafikiService.onWebHook(webHook)
      expect(result).toBeUndefined()
    })

    it('should call outgoing payment completed successfully', async () => {
      const { walletAddress } = await prepareRafikiDependencies()

      createMockRafikiServiceDeps(walletAddress)

      const webHook = mockOutgoingPaymentCompletedEvent({})

      const result = await rafikiService.onWebHook(webHook)
      expect(result).toBeUndefined()
    })

    it('should call outgoing payment failed successfully', async () => {
      const webHook = mockOutgoingPaymentFailedEvent({})

      const result = await rafikiService.onWebHook(webHook)
      expect(result).toBeUndefined()
    })
  })
})
