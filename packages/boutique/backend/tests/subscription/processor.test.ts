import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { OrderStatus } from '@/order/model'
import { IOrderService } from '@/order/service'
import { OpenPayments } from '@/open-payments/service'
import { BillingInterval, ProductType } from '@/product/model'
import { ISubscriptionService } from '@/subscription/service'
import { Subscription, SubscriptionStatus } from '@/subscription/model'
import { SubscriptionProcessor } from '@/subscription/processor'
import { createApp, TestApp } from '@/tests/app'
import { createProducts } from '@/tests/helpers'
import { mockProduct } from '@/tests/mocks'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'

describe('Subscription Processor', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let subscriptionService: ISubscriptionService
  let orderService: IOrderService

  const subscriptionProduct = mockProduct({
    slug: 'processor-subscription-product',
    productType: ProductType.SUBSCRIPTION,
    billingInterval: BillingInterval.DAY,
    billingIntervalCount: 1,
    price: 3.5
  })

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    subscriptionService = container.resolve('subscriptionService')
    orderService = container.resolve('orderService')
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    jest.clearAllMocks()
    jest.useRealTimers()
    await truncateTables(knex)
  })

  test('processDueSubscriptions creates a renewal payment inside the same transaction', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-17T10:05:00.000Z'))

    await createProducts([subscriptionProduct])

    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: subscriptionProduct.price,
        currency: 'EUR',
        walletAddress: 'https://wallet.example/alice'
      },
      knex
    )

    await Subscription.query(knex)
      .findById(subscription.id)
      .patch({
        status: SubscriptionStatus.ACTIVE,
        continueUri: 'https://auth.example/continue',
        continueToken: 'continue-token',
        interactNonce: 'interact-nonce',
        clientNonce: 'client-nonce',
        grantInterval: 'R/2026-03-17T10:00:00Z/P2D',
        accessToken: 'buyer-access-token',
        manageUrl: 'https://auth.example/token/manage',
        nextBillingAt: new Date(Date.now() - 60_000)
      })

    const buyerWallet = {
      id: 'https://wallet.example/alice',
      publicName: 'Alice',
      assetCode: 'EUR',
      assetScale: 2,
      authServer: 'https://auth.example/alice',
      resourceServer: 'https://resource.example/alice'
    }
    const shopWallet = {
      id: env.PAYMENT_POINTER,
      publicName: 'Boutique',
      assetCode: 'EUR',
      assetScale: 2,
      authServer: 'https://auth.example/shop',
      resourceServer: 'https://resource.example/shop'
    }

    const opClient = {
      walletAddress: {
        get: jest.fn(async ({ url }: { url: string }) =>
          url === env.PAYMENT_POINTER ? shopWallet : buyerWallet
        )
      },
      incomingPayment: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/shop/incoming-payments/incoming-1',
          walletAddress: shopWallet.id,
          incomingAmount: {
            value: '350',
            assetCode: 'EUR',
            assetScale: 2
          },
          receivedAmount: {
            value: '0',
            assetCode: 'EUR',
            assetScale: 2
          }
        }))
      },
      grant: {
        request: jest.fn(async () => ({
          access_token: {
            value: 'grant-access-token',
            manage: 'https://auth.example/grants/manage',
            expires_in: 3600
          }
        }))
      },
      quote: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/alice/quotes/quote-1',
          debitAmount: {
            value: '350',
            assetCode: 'EUR',
            assetScale: 2
          }
        }))
      },
      token: {
        rotate: jest.fn(async () => ({
          access_token: {
            value: 'rotated-buyer-access-token',
            manage: 'https://auth.example/token/manage',
            expires_in: 3600
          }
        }))
      },
      outgoingPayment: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/alice/outgoing-payments/outgoing-1'
        }))
      }
    } as never

    const openPayments = new OpenPayments(
      env,
      container.resolve('logger'),
      opClient,
      {
        get: jest.fn(async () => 'shop-access-token')
      } as never,
      {} as never
    )

    const processor = new SubscriptionProcessor(
      container.resolve('logger'),
      knex,
      openPayments,
      orderService
    )

    const processedId = await processor.processDueSubscriptions()

    expect(processedId).toBe(subscription.id)

    const renewedSubscription = await Subscription.query(knex)
      .findById(subscription.id)
      .withGraphFetched('[latestOrder.payments]')
      .throwIfNotFound()

    expect(renewedSubscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(renewedSubscription.latestOrderId).toBeTruthy()
    expect(renewedSubscription.nextBillingAt?.toISOString()).toBe(
      '2026-03-19T10:00:00.000Z'
    )
    expect(renewedSubscription.latestOrder?.status).toBe(OrderStatus.PROCESSING)
    expect(renewedSubscription.latestOrder?.payments).toMatchObject({
      orderId: renewedSubscription.latestOrderId,
      incomingPaymentUrl: 'https://resource.example/shop/incoming-payments/incoming-1',
      walletAddress: buyerWallet.id
    })
  })

  test('processDueSubscriptions stops scheduling after the final installment payment', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-03-17T10:05:00.000Z'))

    await createProducts([subscriptionProduct])

    const subscription = await subscriptionService.create(
      {
        productId: subscriptionProduct.id,
        amount: 10,
        currency: 'EUR',
        walletAddress: 'https://wallet.example/alice',
        totalPayments: 3
      },
      knex
    )

    await Subscription.query(knex)
      .findById(subscription.id)
      .patch({
        status: SubscriptionStatus.ACTIVE,
        continueUri: 'https://auth.example/continue',
        continueToken: 'continue-token',
        interactNonce: 'interact-nonce',
        clientNonce: 'client-nonce',
        grantInterval: 'R3/2026-03-15T10:00:00Z/P1D',
        accessToken: 'buyer-access-token',
        manageUrl: 'https://auth.example/token/manage',
        nextBillingAt: new Date(Date.now() - 60_000),
        currentPeriodNumber: 3
      })

    const buyerWallet = {
      id: 'https://wallet.example/alice',
      publicName: 'Alice',
      assetCode: 'EUR',
      assetScale: 2,
      authServer: 'https://auth.example/alice',
      resourceServer: 'https://resource.example/alice'
    }
    const shopWallet = {
      id: env.PAYMENT_POINTER,
      publicName: 'Boutique',
      assetCode: 'EUR',
      assetScale: 2,
      authServer: 'https://auth.example/shop',
      resourceServer: 'https://resource.example/shop'
    }

    const opClient = {
      walletAddress: {
        get: jest.fn(async ({ url }: { url: string }) =>
          url === env.PAYMENT_POINTER ? shopWallet : buyerWallet
        )
      },
      incomingPayment: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/shop/incoming-payments/incoming-2',
          walletAddress: shopWallet.id,
          incomingAmount: {
            value: '1000',
            assetCode: 'EUR',
            assetScale: 2
          },
          receivedAmount: {
            value: '0',
            assetCode: 'EUR',
            assetScale: 2
          }
        }))
      },
      grant: {
        request: jest.fn(async () => ({
          access_token: {
            value: 'grant-access-token',
            manage: 'https://auth.example/grants/manage',
            expires_in: 3600
          }
        }))
      },
      quote: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/alice/quotes/quote-2',
          debitAmount: {
            value: '1000',
            assetCode: 'EUR',
            assetScale: 2
          }
        }))
      },
      token: {
        rotate: jest.fn(async () => ({
          access_token: {
            value: 'rotated-buyer-access-token',
            manage: 'https://auth.example/token/manage',
            expires_in: 3600
          }
        }))
      },
      outgoingPayment: {
        create: jest.fn(async () => ({
          id: 'https://resource.example/alice/outgoing-payments/outgoing-2'
        }))
      }
    } as never

    const openPayments = new OpenPayments(
      env,
      container.resolve('logger'),
      opClient,
      {
        get: jest.fn(async () => 'shop-access-token')
      } as never,
      {} as never
    )

    const processor = new SubscriptionProcessor(
      container.resolve('logger'),
      knex,
      openPayments,
      orderService
    )

    await processor.processDueSubscriptions()

    const renewedSubscription = await Subscription.query(knex)
      .findById(subscription.id)
      .withGraphFetched('[latestOrder.payments]')
      .throwIfNotFound()

    expect(renewedSubscription.status).toBe(SubscriptionStatus.ACTIVE)
    expect(renewedSubscription.nextBillingAt).toBeNull()
    expect(renewedSubscription.currentPeriodNumber).toBe(3)
    expect(renewedSubscription.latestOrder).toMatchObject({
      total: 10,
      paymentNumber: 3,
      totalPayments: 3,
      status: OrderStatus.PROCESSING
    })
  })
})