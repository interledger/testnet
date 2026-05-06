import axios from 'axios'
import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { IOpenPayments } from '@/open-payments/service'
import { ProductType } from '@/product/model'
import { IProductService } from '@/product/service'
import { ISubscriptionService } from '@/subscription/service'
import { createApp, TestApp } from '@/tests/app'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { randomUUID } from 'crypto'

describe('Order Controller', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let productService: IProductService
  let subscriptionService: ISubscriptionService
  let openPayments: IOpenPayments

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    productService = container.resolve('productService')
    subscriptionService = container.resolve('subscriptionService')
    openPayments = container.resolve('openPayments')
  })

  afterAll(async (): Promise<void> => {
    await app.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    jest.restoreAllMocks()
    await truncateTables(knex)
  })

  test('POST /orders starts a finite recurring grant for installment checkout', async () => {
    const productId = randomUUID()
    const subscriptionId = randomUUID()

    jest.spyOn(productService, 'getById').mockResolvedValueOnce({
      id: productId,
      name: 'Camera',
      price: 30,
      productType: ProductType.ONE_TIME
    } as never)
    jest.spyOn(openPayments, 'getWalletAddressInfo').mockResolvedValueOnce({
      id: 'https://wallet.example/alice',
      assetCode: 'USD',
      assetScale: 2,
      authServer: 'https://auth.example/alice'
    })

    const createSpy = jest
      .spyOn(subscriptionService, 'create')
      .mockResolvedValueOnce({ id: subscriptionId } as never)
    const prepareSubscriptionSpy = jest
      .spyOn(openPayments, 'prepareSubscription')
      .mockResolvedValueOnce({
        redirectUrl: 'https://auth.example/authorize',
        continueUri: 'https://auth.example/continue',
        continueToken: 'continue-token',
        interactNonce: 'interact-nonce',
        clientNonce: 'client-nonce',
        walletAddress: 'https://wallet.example/alice'
      })
    const setPendingGrantDataSpy = jest
      .spyOn(subscriptionService, 'setPendingGrantData')
      .mockResolvedValueOnce({ id: subscriptionId } as never)

    const response = await axios.post(`http://localhost:${app.port}/orders`, {
      walletAddressUrl: 'https://wallet.example/alice',
      paymentPlan: 'INSTALLMENTS_3',
      products: [
        {
          productId,
          quantity: 1
        }
      ]
    })

    expect(createSpy).toHaveBeenCalledWith(
      {
        productId,
        quantity: 1,
        amount: 10,
        currency: 'USD',
        walletAddress: 'https://wallet.example/alice',
        totalPayments: 3
      },
      expect.anything()
    )
    expect(prepareSubscriptionSpy).toHaveBeenCalledWith({
      walletAddressUrl: 'https://wallet.example/alice',
      amount: 10,
      identifier: subscriptionId,
      finishUrl:
        `${env.FRONTEND_URL}/subscriptions/confirmation?subscriptionId=${subscriptionId}`,
      interval: expect.stringMatching(/^R3\/.+\/P1M$/)
    })
    expect(setPendingGrantDataSpy).toHaveBeenCalledWith(subscriptionId, {
      continueUri: 'https://auth.example/continue',
      continueToken: 'continue-token',
      interactNonce: 'interact-nonce',
      clientNonce: 'client-nonce',
      grantInterval: expect.stringMatching(/^R3\/.+\/P1M$/),
      walletAddress: 'https://wallet.example/alice'
    })
    expect(response.status).toBe(201)
    expect(response.data).toMatchObject({
      success: true,
      result: {
        redirectUrl: 'https://auth.example/authorize'
      }
    })
  })

  test('POST /orders rejects installment checkout for carts with multiple products', async () => {
    await expect(
      axios.post(`http://localhost:${app.port}/orders`, {
        walletAddressUrl: 'https://wallet.example/alice',
        paymentPlan: 'INSTALLMENTS_3',
        products: [
          {
            productId: randomUUID(),
            quantity: 1
          },
          {
            productId: randomUUID(),
            quantity: 1
          }
        ]
      })
    ).rejects.toMatchObject({
      response: {
        status: 400
      }
    })
  })
})