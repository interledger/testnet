import { env } from '@/config/env'
import { Cradle, createContainer } from '@/createContainer'
import { EventType, RafikiService } from '@/rafiki/service'
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
    it('call outgoing payment should fail because invalid input', async () => {
      const { walletAddress } = await prepareRafikiDependencies()

      createMockRafikiServiceDeps(walletAddress)

      const webHook = mockOutgoingPaymentCreatedEvent({
        data: { debitAmount: {} }
      })

      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /Invalid Input for outgoing_payment.created/
      )
    })
    it('call outgoing payment should fail because because invalid input', async () => {
      const { walletAddress } = await prepareRafikiDependencies()

      createMockRafikiServiceDeps(walletAddress)

      const webHook = mockOutgoingPaymentCreatedEvent({
        data: { debitAmount: { value: '' } }
      })

      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /Invalid Input for outgoing_payment.created/
      )
    })

    it('should call outgoing payment completed successfully', async () => {
      const { walletAddress } = await prepareRafikiDependencies()

      createMockRafikiServiceDeps(walletAddress)

      const webHook = mockOutgoingPaymentCompletedEvent({})

      const result = await rafikiService.onWebHook(webHook)
      expect(result).toBeUndefined()
    })

    it('call outgoing payment completed should fail because invalid input', async () => {
      const webHook = mockOutgoingPaymentCompletedEvent({ data: {} })

      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /Invalid Input for outgoing_payment.completed/
      )
    })

    it('should call outgoing payment failed successfully', async () => {
      const webHook = mockOutgoingPaymentFailedEvent({})

      const result = await rafikiService.onWebHook(webHook)
      expect(result).toBeUndefined()
    })
    it('call outgoing payment failed should fail because invalid data', async () => {
      const webHook = mockOutgoingPaymentFailedEvent({
        data: { debitAmount: {} }
      })

      //const result = await rafikiService.onWebHook(webHook)
      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /Invalid Input for outgoing_payment.failed/
      )
    })

    it('should throw an error unknow event type mock-event', async () => {
      const webHook = mockOutgoingPaymentCreatedEvent({
        type: 'mock-event' as EventType
      })

      await expect(rafikiService.onWebHook(webHook)).rejects.toThrowError(
        /unknown event type, mock-event/
      )
    })
  })
})
