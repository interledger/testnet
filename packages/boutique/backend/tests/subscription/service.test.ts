import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { BillingInterval, ProductType } from '@/product/model'
import { createApp, TestApp } from '@/tests/app'
import { createProducts } from '@/tests/helpers'
import { mockProduct } from '@/tests/mocks'
import { ISubscriptionService } from '@/subscription/service'
import { SubscriptionStatus } from '@/subscription/model'
import { NotFound } from '@shared/backend'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { randomUUID } from 'crypto'

describe('Subscription Service', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let subscriptionService: ISubscriptionService

  const subscriptionProduct = mockProduct({
    slug: 'sub-product',
    productType: ProductType.SUBSCRIPTION,
    billingInterval: BillingInterval.MONTH,
    billingIntervalCount: 1
  })

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    subscriptionService = container.resolve('subscriptionService')
  })

  beforeEach(async (): Promise<void> => {
    await createProducts([subscriptionProduct])
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  test('creates a pending subscription', async () => {
    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    expect(subscription.productId).toBe(subscriptionProduct.id)
    expect(subscription.status).toBe(SubscriptionStatus.PENDING)
  })

  test('stores grant interval with pending grant data', async () => {
    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    const updated = await subscriptionService.setPendingGrantData(
      subscription.id,
      {
        continueUri: 'https://auth.example/continue',
        continueToken: 'continue-token',
        interactNonce: 'interact-nonce',
        clientNonce: 'client-nonce',
        grantInterval: 'R/2026-03-17T12:00:00Z/P1M',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    expect(updated.grantInterval).toBe('R/2026-03-17T12:00:00Z/P1M')
  })

  test('throws NotFound when subscription does not exist', async () => {
    await expect(subscriptionService.get(randomUUID())).rejects.toThrowError(
      NotFound
    )
  })

  test('lists subscriptions by wallet address', async () => {
    await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/bob'
      },
      knex
    )

    const rows = await subscriptionService.list('https://example.com/alice')

    expect(rows).toHaveLength(1)
    expect(rows[0].walletAddress).toBe('https://example.com/alice')
  })

  test('can cancel subscription', async () => {
    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    const canceled = await subscriptionService.cancel(subscription.id, knex)

    expect(canceled.status).toBe(SubscriptionStatus.CANCELED)
    expect(canceled.canceledAt).toBeTruthy()
  })

  test('can mark subscription past due and increment retry count', async () => {
    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'USD',
        walletAddress: 'https://example.com/alice'
      },
      knex
    )

    const updated = await subscriptionService.markPastDue(subscription.id, knex)

    expect(updated.status).toBe(SubscriptionStatus.PAST_DUE)
    expect(updated.retryCount).toBe(1)
  })
})
