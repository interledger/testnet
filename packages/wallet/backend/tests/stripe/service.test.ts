import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
import { faker } from '@faker-js/faker'
import { AwilixContainer } from 'awilix'
import { StripeService, EventType } from '@/stripe/service'
import { GateHubClient } from '@/gatehub/client'
import { TransactionTypeEnum } from '@/gatehub/consts'
import { StripeWebhookType } from '../../src/stripe/validation'

describe('Stripe Service', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let stripeService: StripeService

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
        last_payment_error: type === EventType.payment_intent_payment_failed ? 'Payment failed' : null
      }
    },
    ...overrides
  })

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    stripeService = await bindings.resolve('stripeService')
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
    Reflect.set(
      stripeService,
      'gateHubClient',
      mockGateHubClient as unknown as GateHubClient
    )
    Reflect.set(stripeService, 'logger', mockLogger)

    // Mock vault UUID lookup
    mockGateHubClient.getVaultUuid.mockReturnValue('vault-uuid-123')
  })

  describe('onWebHook', (): void => {

    it('should handle payment_intent_succeeded event type', async (): Promise<void> => {
      const webhook = createMockWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: webhook.data.object.amount,
        vault_uuid: 'vault-uuid-123',
        receiving_address: webhook.data.object.metadata.receiving_address,
        sending_address: env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
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
    })


    it('should log information about the received webhook', async (): Promise<void> => {
      const webhook = createMockWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining(`received webhook of type : ${webhook.type} for : ${webhook.id}`)
      )
    })
  })

  describe('handlePaymentIntentSucceeded', (): void => {
    it('should create transaction with correct parameters', async (): Promise<void> => {
      const webhook = createMockWebhook()

      // Use Reflect to access the private method
      await Reflect.get(stripeService, 'handlePaymentIntentSucceeded').call(
        stripeService,
        webhook
      )

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: webhook.data.object.amount,
        vault_uuid: 'vault-uuid-123',
        receiving_address: webhook.data.object.metadata.receiving_address,
        sending_address: env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
        type: TransactionTypeEnum.HOSTED,
        message: 'Stripe Transfer'
      })
    })

    it('should throw error when GateHub transaction creation fails', async (): Promise<void> => {
      const webhook = createMockWebhook()
      mockGateHubClient.createTransaction.mockRejectedValueOnce(new Error('GateHub error'))

      const handlePaymentIntentSucceeded = Reflect.get(stripeService, 'handlePaymentIntentSucceeded')
      await expect(
        handlePaymentIntentSucceeded.call(stripeService, webhook)
      ).rejects.toThrow('Failed to create transaction')

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error creating gatehub transaction',
        expect.objectContaining({
          error: expect.any(Error)
        })
      )
    })
  })

  describe('handlePaymentIntentFailed', (): void => {
    it('should log payment failure details', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_payment_failed)

      // Use Reflect to access the private method
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
    })
  })

  describe('handlePaymentIntentCanceled', (): void => {
    it('should log payment cancellation details', async (): Promise<void> => {
      const webhook = createMockWebhook(EventType.payment_intent_canceled)

      // Use Reflect to access the private method
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
    })
  })
})
