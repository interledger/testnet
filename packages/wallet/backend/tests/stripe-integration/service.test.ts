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
import { BadRequest } from '@shared/backend'
import { UniqueViolationError } from 'objection'

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
    getByUrl: jest.fn(),
    getById: jest.fn()
  }

  const mockAccountService = {
    getGateHubWalletAddress: jest.fn(),
    getAccountBalance: jest.fn()
  }

  const paymentIntentId = 'pi_123456'

  const createMockPaymentIntentWebhook = (
    type:
      | EventType.payment_intent_succeeded
      | EventType.payment_intent_payment_failed
      | EventType.payment_intent_canceled = EventType.payment_intent_succeeded,
    overrides: Record<string, unknown> = {}
  ): StripeWebhookType =>
    ({
      id: faker.string.uuid(),
      type,
      data: {
        object: {
          id: paymentIntentId,
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
    }) as StripeWebhookType

  const createMockRefundWebhook = (
    type:
      | EventType.refund_created
      | EventType.refund_updated
      | EventType.refund_failed,
    overrides: {
      refundId?: string
      amount?: number
      status?: string
      currency?: string
      paymentIntent?: string | null
      failureReason?: string | null
      webhookId?: string
    } = {}
  ): StripeWebhookType => {
    const {
      refundId = 're_123456',
      amount = 500,
      status = type === EventType.refund_updated ? 'succeeded' : 'pending',
      currency = 'usd',
      paymentIntent = paymentIntentId,
      failureReason = type === EventType.refund_failed ? 'declined' : null,
      webhookId = faker.string.uuid()
    } = overrides

    return {
      id: webhookId,
      type,
      data: {
        object: {
          id: refundId,
          amount,
          currency,
          status,
          payment_intent: paymentIntent,
          charge: 'ch_123456',
          failure_reason: failureReason
        }
      }
    } as StripeWebhookType
  }

  const createMockChargeRefundedWebhook = (): StripeWebhookType =>
    ({
      id: faker.string.uuid(),
      type: EventType.charge_refunded,
      data: {
        object: {
          id: 'ch_123456',
          payment_intent: paymentIntentId,
          amount_refunded: 500,
          refunded: false
        }
      }
    }) as StripeWebhookType

  const insertOriginalStripePayment = async (
    value = 1000n
  ): Promise<Transaction> => {
    return Transaction.query().insert({
      walletAddressId: walletAddress.id,
      accountId: account.id,
      paymentId: paymentIntentId,
      assetCode: 'USD',
      value,
      type: 'INCOMING',
      status: 'COMPLETED',
      description: 'Stripe Payment',
      source: 'Stripe'
    })
  }

  const spyOnTransactionWithOutgoingRefundInsertFailure = (
    rejectInsert: () => Promise<unknown>
  ): jest.SpyInstance => {
    const originalQuery = Transaction.query.bind(Transaction)

    return jest.spyOn(Transaction, 'query').mockImplementation(() => {
      const qb = originalQuery()
      const originalInsert = qb.insert.bind(qb)

      return Object.assign(qb, {
        insert: (data: Partial<Transaction>) => {
          if (data.paymentId === 're_123456' && data.type === 'OUTGOING') {
            return rejectInsert()
          }
          return originalInsert(data)
        }
      })
    })
  }

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
    mockWalletAddressService.getById.mockResolvedValue(walletAddress)

    mockAccountService.getAccountBalance.mockResolvedValue(100)

    mockAccountService.getGateHubWalletAddress.mockResolvedValue({
      gateHubWalletId: 'gatehub-wallet-123',
      gateHubUserId: 'test-gatehub-user'
    })
  })

  describe('onWebHook', (): void => {
    it('should handle payment_intent_succeeded event type', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: 10,
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
        paymentId: paymentIntentId,
        assetCode: 'USD',
        type: 'INCOMING',
        status: 'COMPLETED',
        description: 'Stripe Payment',
        source: 'Stripe'
      })
    })

    it('should handle payment_intent_payment_failed event type', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook(
        EventType.payment_intent_payment_failed
      )

      await stripeService.onWebHook(webhook)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Payment intent failed',
        expect.objectContaining({
          payment_intent_id: paymentIntentId,
          receiving_address: 'wallet_address_123',
          error: 'Payment failed'
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })

    it('should handle payment_intent_canceled event type', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook(
        EventType.payment_intent_canceled
      )

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment intent canceled',
        expect.objectContaining({
          payment_intent_id: paymentIntentId,
          receiving_address: 'wallet_address_123'
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })

    it('should log information about the received webhook', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook()

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
      const webhook = createMockPaymentIntentWebhook()

      await Reflect.get(stripeService, 'handlePaymentIntentSucceeded').call(
        stripeService,
        webhook
      )

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith({
        amount: 10,
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
        paymentId: paymentIntentId,
        assetCode: 'USD',
        type: 'INCOMING',
        status: 'COMPLETED',
        description: 'Stripe Payment',
        source: 'Stripe'
      })
    })

    it('should throw error when GateHub transaction creation fails', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook()
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
      const webhook = createMockPaymentIntentWebhook(
        EventType.payment_intent_payment_failed
      )

      await Reflect.get(stripeService, 'handlePaymentIntentFailed').call(
        stripeService,
        webhook
      )

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Payment intent failed',
        expect.objectContaining({
          payment_intent_id: paymentIntentId,
          receiving_address: 'wallet_address_123',
          error: 'Payment failed'
        })
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })
  })

  describe('handlePaymentIntentCanceled', (): void => {
    it('should log payment cancellation details', async (): Promise<void> => {
      const webhook = createMockPaymentIntentWebhook(
        EventType.payment_intent_canceled
      )

      await Reflect.get(stripeService, 'handlePaymentIntentCanceled').call(
        stripeService,
        webhook
      )

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Payment intent canceled',
        expect.objectContaining({
          payment_intent_id: paymentIntentId,
          receiving_address: 'wallet_address_123'
        })
      )

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })
  })

  describe('refund webhooks', (): void => {
    it('should log refund.created without creating transactions when pending', async (): Promise<void> => {
      const webhook = createMockRefundWebhook(EventType.refund_created)

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refund created',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId,
          amount: 500,
          currency: 'usd',
          status: 'pending'
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const transactions = await Transaction.query()
      expect(transactions).toHaveLength(0)
    })

    it('should process refund.created when status is succeeded', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_created, {
        status: 'succeeded'
      })

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refund created',
        expect.objectContaining({ status: 'succeeded' })
      )
      expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(1)

      const refundTransactions = await Transaction.query().where(
        'paymentId',
        're_123456'
      )
      expect(refundTransactions).toHaveLength(1)
    })

    it('should skip duplicate processing when refund.created and refund.updated both succeed', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const createdWebhook = createMockRefundWebhook(EventType.refund_created, {
        status: 'succeeded'
      })
      const updatedWebhook = createMockRefundWebhook(EventType.refund_updated, {
        status: 'succeeded'
      })

      await stripeService.onWebHook(createdWebhook)
      await stripeService.onWebHook(updatedWebhook)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refund already processed',
        expect.objectContaining({ refund_id: 're_123456' })
      )
    })

    it('should log charge.refunded without creating transactions', async (): Promise<void> => {
      const webhook = createMockChargeRefundedWebhook()

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Charge refunded',
        expect.objectContaining({
          charge_id: 'ch_123456',
          payment_intent_id: paymentIntentId
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should log refund.failed without creating transactions', async (): Promise<void> => {
      const webhook = createMockRefundWebhook(EventType.refund_failed)

      await stripeService.onWebHook(webhook)

      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Refund failed',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId,
          failure_reason: 'declined'
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should log refund.updated when status is not succeeded', async (): Promise<void> => {
      const webhook = createMockRefundWebhook(EventType.refund_updated, {
        status: 'pending'
      })

      await stripeService.onWebHook(webhook)

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refund updated',
        expect.objectContaining({
          refund_id: 're_123456',
          status: 'pending'
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should reverse gatehub transaction on refund.updated succeeded', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await stripeService.onWebHook(webhook)

      expect(mockAccountService.getAccountBalance).toHaveBeenCalledWith(
        expect.objectContaining({ id: account.id })
      )
      expect(mockGateHubClient.createTransaction).toHaveBeenCalledWith(
        {
          amount: 5,
          vault_uuid: 'vault-uuid-123',
          sending_address: 'gatehub-wallet-123',
          receiving_address: env.GATEHUB_SETTLEMENT_WALLET_ADDRESS,
          type: TransactionTypeEnum.HOSTED,
          message: 'Stripe Refund'
        },
        'test-gatehub-user'
      )

      const transactions = await Transaction.query().orderBy('createdAt', 'asc')
      expect(transactions).toHaveLength(2)
      expect(transactions[1]).toMatchObject({
        walletAddressId: walletAddress.id,
        accountId: account.id,
        paymentId: 're_123456',
        assetCode: 'USD',
        type: 'OUTGOING',
        status: 'COMPLETED',
        description: `Stripe Refund (${paymentIntentId})`,
        source: 'Stripe'
      })
    })

    it('should skip processing when refund was already processed', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await stripeService.onWebHook(webhook)
      await stripeService.onWebHook(webhook)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(1)

      const refundTransactions = await Transaction.query().where(
        'paymentId',
        're_123456'
      )
      expect(refundTransactions).toHaveLength(1)
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Refund already processed',
        expect.objectContaining({ refund_id: 're_123456' })
      )
    })

    it('should support partial refunds', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const firstRefund = createMockRefundWebhook(EventType.refund_updated, {
        refundId: 're_partial_1',
        amount: 300
      })
      const secondRefund = createMockRefundWebhook(EventType.refund_updated, {
        refundId: 're_partial_2',
        amount: 200
      })

      await stripeService.onWebHook(firstRefund)
      await stripeService.onWebHook(secondRefund)

      expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(2)
      expect(mockGateHubClient.createTransaction).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ amount: 3 }),
        'test-gatehub-user'
      )
      expect(mockGateHubClient.createTransaction).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ amount: 2 }),
        'test-gatehub-user'
      )

      const refundTransactions = await Transaction.query()
        .where('type', 'OUTGOING')
        .orderBy('createdAt', 'asc')
      expect(refundTransactions).toHaveLength(2)
    })

    it('should stop without retry when original payment is not found', async (): Promise<void> => {
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Original Stripe payment not found',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
      expect(mockAccountService.getAccountBalance).not.toHaveBeenCalled()
    })

    it('should stop without retry when refund currency does not match original payment', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_updated, {
        currency: 'eur'
      })

      await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Refund currency does not match original payment',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId
        })
      )
      expect(mockAccountService.getAccountBalance).not.toHaveBeenCalled()
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should stop without retry when wallet address is inactive', async (): Promise<void> => {
      await insertOriginalStripePayment()
      mockWalletAddressService.getById.mockRejectedValueOnce(
        new BadRequest('Not found')
      )
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Wallet address not found or inactive for original payment',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId
        })
      )
      expect(mockAccountService.getAccountBalance).not.toHaveBeenCalled()
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should stop without retry when gatehub wallet address cannot be resolved', async (): Promise<void> => {
      await insertOriginalStripePayment()
      mockAccountService.getGateHubWalletAddress.mockRejectedValueOnce(
        new BadRequest('No account associated to the provided wallet address')
      )
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Wallet address not found or inactive for original payment',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId
        })
      )
      expect(mockAccountService.getAccountBalance).not.toHaveBeenCalled()
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()
    })

    it('should stop without retry when user has insufficient balance for refund reversal', async (): Promise<void> => {
      await insertOriginalStripePayment()
      mockAccountService.getAccountBalance.mockResolvedValueOnce(3)
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Insufficient funds for refund reversal',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId,
          required: 5,
          available: 3
        })
      )
      expect(mockGateHubClient.createTransaction).not.toHaveBeenCalled()

      const refundTransactions = await Transaction.query().where(
        'paymentId',
        're_123456'
      )
      expect(refundTransactions).toHaveLength(0)
    })

    it('should treat duplicate insert as already processed after gatehub reversal', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      const querySpy = spyOnTransactionWithOutgoingRefundInsertFailure(() => {
        // db-errors constructor shape; objection types only expose string overload
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const error = new (UniqueViolationError as any)({
          nativeError: new Error('duplicate'),
          client: 'postgres'
        })
        return Promise.reject(error)
      })

      try {
        await expect(stripeService.onWebHook(webhook)).resolves.toBeUndefined()

        expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(1)
        expect(mockLogger.info).toHaveBeenCalledWith(
          'Refund already processed',
          expect.objectContaining({ refund_id: 're_123456' })
        )
      } finally {
        querySpy.mockRestore()
      }
    })

    it('should throw generic error when gatehub reversal fails', async (): Promise<void> => {
      await insertOriginalStripePayment()
      mockGateHubClient.createTransaction.mockRejectedValueOnce(
        new Error('Insufficient funds')
      )
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      await expect(stripeService.onWebHook(webhook)).rejects.toThrow(
        'Failed to reverse transaction for refund'
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error reversing gatehub transaction for refund',
        expect.objectContaining({
          refund_id: 're_123456',
          payment_intent_id: paymentIntentId
        })
      )

      const refundTransactions = await Transaction.query().where(
        'paymentId',
        're_123456'
      )
      expect(refundTransactions).toHaveLength(0)
    })

    it('should throw when db insert fails after gatehub reversal', async (): Promise<void> => {
      await insertOriginalStripePayment()
      const webhook = createMockRefundWebhook(EventType.refund_updated)

      const querySpy = spyOnTransactionWithOutgoingRefundInsertFailure(() =>
        Promise.reject(new Error('DB error'))
      )

      try {
        await expect(stripeService.onWebHook(webhook)).rejects.toThrow(
          'Failed to reverse transaction for refund'
        )

        expect(mockGateHubClient.createTransaction).toHaveBeenCalledTimes(1)
      } finally {
        querySpy.mockRestore()
      }
    })
  })
})
