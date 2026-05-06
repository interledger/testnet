import axios from 'axios'
import { createContainer, type Cradle } from '@/container'
import { env } from '@/config/env'
import { IOpenPayments } from '@/open-payments/service'
import { SubscriptionStatus } from '@/subscription/model'
import { ISubscriptionProcessor } from '@/subscription/processor'
import { ISubscriptionService } from '@/subscription/service'
import { createApp, TestApp } from '@/tests/app'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
import { randomUUID } from 'crypto'

describe('Subscription Controller', (): void => {
  let container: AwilixContainer<Cradle>
  let app: TestApp
  let knex: Knex
  let subscriptionProcessor: ISubscriptionProcessor
  let subscriptionService: ISubscriptionService
  let openPayments: IOpenPayments

  beforeAll(async (): Promise<void> => {
    container = await createContainer(env)
    app = await createApp(container)
    knex = app.knex
    subscriptionProcessor = container.resolve('subscriptionProcessor')
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

  test('POST /subscriptions/:id/retry retries a past due subscription immediately', async () => {
    const subscriptionId = randomUUID()
    const retrySpy = jest
      .spyOn(subscriptionProcessor, 'retrySubscription')
      .mockResolvedValueOnce({
        id: subscriptionId,
        status: SubscriptionStatus.ACTIVE,
        retryCount: 0
      } as never)

    const response = await axios.post(
      `http://localhost:${app.port}/subscriptions/${subscriptionId}/retry`
    )

    expect(retrySpy).toHaveBeenCalledWith(subscriptionId)
    expect(response.status).toBe(200)
    expect(response.data).toMatchObject({
      success: true,
      result: {
        id: subscriptionId,
        status: SubscriptionStatus.ACTIVE
      }
    })
  })

  test('POST /subscriptions/:id/reauthorize starts a fresh grant flow for a past due subscription', async () => {
    const subscriptionId = randomUUID()
    const interactNonce = randomUUID()
    const clientNonce = randomUUID()
    const getSpy = jest
      .spyOn(subscriptionService, 'get')
      .mockResolvedValueOnce({
        id: subscriptionId,
        status: SubscriptionStatus.PAST_DUE,
        walletAddress: 'https://wallet.example/alice',
        amount: 12.5,
        product: {
          billingInterval: 'MONTH',
          billingIntervalCount: 1
        }
      } as never)
    const prepareSpy = jest
      .spyOn(openPayments, 'prepareSubscription')
      .mockResolvedValueOnce({
        redirectUrl: 'https://auth.example/authorize',
        continueUri: 'http://rafiki-auth:3006/continue/subscription',
        continueToken: 'continue-token',
        interactNonce,
        clientNonce,
        walletAddress: 'https://wallet.example/alice'
      })
    const setPendingGrantDataSpy = jest
      .spyOn(subscriptionService, 'setPendingGrantData')
      .mockResolvedValueOnce({ id: subscriptionId } as never)

    const response = await axios.post(
      `http://localhost:${app.port}/subscriptions/${subscriptionId}/reauthorize`
    )

    expect(getSpy).toHaveBeenCalledWith(subscriptionId)
    expect(prepareSpy).toHaveBeenCalledWith({
      walletAddressUrl: 'https://wallet.example/alice',
      amount: 12.5,
      identifier: subscriptionId,
      finishUrl:
        `http://localhost:4003/subscriptions/reauthorize/confirmation?subscriptionId=${subscriptionId}`,
      interval: expect.stringMatching(/^R\/.+\/P1M$/)
    })
    expect(setPendingGrantDataSpy).toHaveBeenCalledWith(subscriptionId, {
      continueUri: 'http://rafiki-auth:3006/continue/subscription',
      continueToken: 'continue-token',
      interactNonce,
      clientNonce,
      grantInterval: expect.stringMatching(/^R\/.+\/P1M$/),
      walletAddress: 'https://wallet.example/alice'
    })
    expect(response.status).toBe(200)
    expect(response.data).toMatchObject({
      success: true,
      result: {
        redirectUrl: 'https://auth.example/authorize'
      }
    })
  })

  test('PATCH /subscriptions/:id/reauthorize stores fresh grant tokens for future payments', async () => {
    const subscriptionId = randomUUID()
    const nextBillingAt = new Date('2030-01-01T00:00:00.000Z')
    const patchAndFetch = jest.fn().mockResolvedValue({
      status: SubscriptionStatus.PAST_DUE,
      nextBillingAt
    })
    const subscription = {
      id: subscriptionId,
      status: SubscriptionStatus.PAST_DUE,
      walletAddress: 'https://wallet.example/alice',
      clientNonce: randomUUID(),
      interactNonce: randomUUID(),
      continueToken: 'continue-token',
      continueUri: 'http://rafiki-auth:3006/continue/subscription',
      $query: jest.fn().mockReturnValue({
        patchAndFetch
      })
    }

    jest.spyOn(subscriptionService, 'get').mockResolvedValueOnce(subscription as never)
    const verifyHashSpy = jest
      .spyOn(openPayments, 'verifyHash')
      .mockResolvedValueOnce()
    const continueGrantSpy = jest
      .spyOn(openPayments, 'continueGrant')
      .mockResolvedValueOnce({
        accessToken: 'new-access-token',
        manageUrl: 'http://rafiki-auth:3006/token/subscription'
      })

    const response = await axios.patch(
      `http://localhost:${app.port}/subscriptions/${subscriptionId}/reauthorize`,
      {
        hash: 'authorization-hash',
        interactRef: randomUUID()
      }
    )

    expect(verifyHashSpy).toHaveBeenCalledWith({
      interactRef: expect.any(String),
      receivedHash: 'authorization-hash',
      walletAddressUrl: 'https://wallet.example/alice',
      clientNonce: subscription.clientNonce,
      interactNonce: subscription.interactNonce
    })
    expect(continueGrantSpy).toHaveBeenCalledWith({
      accessToken: 'continue-token',
      url: 'http://rafiki-auth:3006/continue/subscription',
      interactRef: expect.any(String)
    })
    expect(patchAndFetch).toHaveBeenCalledWith({
      accessToken: 'new-access-token',
      manageUrl: 'http://rafiki-auth:3006/token/subscription'
    })
    expect(response.status).toBe(200)
    expect(response.data).toMatchObject({
      success: true,
      result: {
        status: SubscriptionStatus.PAST_DUE,
        nextBillingAt: nextBillingAt.toISOString()
      }
    })
  })
})