import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import { faker } from '@faker-js/faker'
import { AwilixContainer } from 'awilix'
import { StripeService, EventType } from '@/stripe-integration/service'
import { GateHubClient } from '@/gatehub/client'
import { TransactionTypeEnum } from '@/gatehub/consts'
import { StripeWebhookType } from '../../src/stripe-integration/validation'
import { Transaction } from '@/transaction/model'
import { Account } from '@/account/model'
import { WalletAddress } from '@/walletAddress/model'
import { loginUser } from '@/tests/utils'
import { mockedListAssets } from '@/tests/mocks'

describe('Stripe Service', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let stripeService: StripeService
  let userId: string
  let account: Account
  let walletAddress: WalletAddress
  let walletId: string

  const mockGateHubClient = {
    createTransaction: jest.fn(),
    getVaultUuid: jest.fn()
  }

  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }

  const mockWalletAddressService = {
    getByUrl: jest.fn()
  }

  const mockAccountService = {
    getGateHubWalletAddress: jest.fn()
  }

  const createMockWebhook = (
    type: EventType = EventType.payment_intent_succeeded,
    overrides: Partial<StripeWebhookType> = {}
  ): StripeWebhookType => ({
    id: faker.string.uuid(),
    type,
    data: {
      object: {
        id: 'pi_123456',
        amount: 1000,
        currency: 'usd',
        metadata: {
          receiving_address: 'wallet_address_123'
        },
        last_payment_error:
          type === EventType.payment_intent_payment_failed
            ? 'Payment failed'
            : null
      }
    },
    ...overrides
  })

  beforeAll(async (): Promise<void> => {
    const testEnv = { ...env, USE_STRIPE: true }
    bindings = await createContainer(testEnv)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    stripeService = (await bindings.resolve('stripeService')) as StripeService
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    jest.resetAllMocks()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  beforeEach(async (): Promise<void> => {
    // Necessary db setup for transaction creation
    const { user } = await loginUser({
      authService: await bindings.resolve('authService'),
      extraUserArgs: {
        isEmailVerified: true,
        gateHubUserId: 'test-gatehub-user'
      }
    })
    userId = user.id
    walletId = faker.string.uuid()

    account = await Account.query().insert({
      name: faker.string.alpha(10),
      userId: userId,
      assetCode: 'USD',
      assetId: mockedListAssets[0].id,
      assetScale: 2,
      gateHubWalletId: 'gatehub-wallet-123'
    })

    walletAddress = await WalletAddress.query().insert({
      url: 'wallet_address_123',
      publicName: 'Test Wallet',
      accountId: account.id,
      id: walletId
    })

    Reflect.set(
      stripeService,
      'gateHubClient',
      mockGateHubClient as unknown as GateHubClient
    )
    Reflect.set(stripeService, 'logger', mockLogger)
    Reflect.set(stripeService, 'walletAddressService', mockWalletAddressService)
    Reflect.set(stripeService, 'accountService', mockAccountService)

    mockGateHubClient.getVaultUuid.mockReturnValue('vault-uuid-123')

    mockGateHubClient.createTransaction.mockResolvedValue(undefined)

    mockWalletAddressService.getByUrl.mockResolvedValue(walletAddress)

    mockAccountService.getGateHubWalletAddress.mockResolvedValue({
      gateHubWalletId: 'gatehub-wallet-123'
    })
  })

  describe('onWebHook', (): void => {
    it('should handle payment_intent_succeeded event type', async (): Promise<void> => {
      const webhook = createMockWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: webhook.data.object.amount,
        vault_uuid: 'vault-uuid-123',
        receiving_address: 'gatehub-wallet-123',
        sending_address: env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
      })

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(1)
      expect(transactions[0]).toMatchObject({
        walletAddressId: walletAddress.id,
        accountId: account.id,
        paymentId: webhook.data.object.id,
        assetCode: webhook.data.object.currency.toUpperCase(),
        type: 'INCOMING',
        status: 'COMPLETED',
        description: 'Stripe Payment',
        source: 'Stripe'
      })
    })

    it('should handle payment_intent_payment_failed event type', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_payment_failed)

      await stripeService.onWebHook(webhook)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Payment intent failed',
        expect.objectContaining({
          payment_intent_id: webhook.data.object.id,
          receiving_address: webhook.data.object.metadata.receiving_address,
          error: webhook.data.object.last_payment_error
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })

    it('should handle payment_intent_canceled event type', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_canceled)

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment intent canceled',
        expect.objectContaining({
          payment_intent_id: webhook.data.object.id,
          receiving_address: webhook.data.object.metadata.receiving_address
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })

    it('should log information about the received webhook', async (): Promise<void> => {
      const webhook = createMockWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `received webhook of type : ${webhook.type} for : ${webhook.id}`
        )
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(1)
    })
  })

  describe('handlePaymentIntentSucceeded', (): void => {
    it('should create transaction with correct parameters', async (): Promise<void> => {
      const webhook = createMockWebhook()

      await Reflect.get(stripeService, 'handlePaymentIntentSucceeded').call(
        stripeService,
        webhook
      )

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: webhook.data.object.amount,
        vault_uuid: 'vault-uuid-123',
        receiving_address: 'gatehub-wallet-123',
        sending_address: env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
      })

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(1)
      expect(transactions[0]).toMatchObject({
        walletAddressId: walletAddress.id,
        accountId: account.id,
        paymentId: webhook.data.object.id,
        assetCode: webhook.data.object.currency.toUpperCase(),
        type: 'INCOMING',
        status: 'COMPLETED',
        description: 'Stripe Payment',
        source: 'Stripe'
      })
    })

    it('should throw error when GateHub transaction creation fails', async (): Promise<void> => {
      const webhook = createMockWebhook()
      mockGateHubClient.createTransaction.mockRejectedValueOnce(
        new Error('GateHub error')
      )

      const handlePaymentIntentSucceeded = Reflect.get(
        stripeService,
        'handlePaymentIntentSucceeded'
      )
      await expect(
        handlePaymentIntentSucceeded.call(stripeService, webhook)
      ).rejects.toThrow('Failed to create transaction')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating gatehub transaction',
        expect.objectContaining({
          error: expect.any(Error)
        })
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })
  })

  describe('handlePaymentIntentFailed', (): void => {
    it('should log payment failure details', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_payment_failed)

      await Reflect.get(stripeService, 'handlePaymentIntentFailed').call(
        stripeService,
        webhook
      )

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Payment intent failed',
        expect.objectContaining({
          payment_intent_id: webhook.data.object.id,
          receiving_address: webhook.data.object.metadata.receiving_address,
          error: webhook.data.object.last_payment_error
        })
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })
  })

  describe('handlePaymentIntentCanceled', (): void => {
    it('should log payment cancellation details', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_canceled)

      await Reflect.get(stripeService, 'handlePaymentIntentCanceled').call(
        stripeService,
        webhook
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment intent canceled',
        expect.objectContaining({
          payment_intent_id: webhook.data.object.id,
          receiving_address: webhook.data.object.metadata.receiving_address
        })
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })
  })
})
