import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { StripeController } from '@/stripe-integration/controller'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { errorHandler } from '@/tests/helpers'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { EventType } from '@/stripe-integration/service'
import { BadRequest } from '@shared/backend'

const mockConstructEvent = jest.fn()

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => {
    return {
      webhooks: {
        constructEvent: mockConstructEvent
      }
    }
  })
})

describe('Stripe Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let stripeController: StripeController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()

  const createReqRes = async () => {
    res = createResponse()
    req = createRequest()
    req.headers['stripe-signature'] = 'mock-signature'
    req.body = Buffer.from(
      JSON.stringify({
        id: 'webhookId123',
        type: EventType.payment_intent_succeeded,
        data: {
          object: {
            id: 'pi_123456',
            amount: 1000,
            currency: 'usd',
            metadata: {
              receiving_address: 'wallet_address_123'
            }
          }
        }
      })
    )

    await applyMiddleware(withSession, req, res)
  }

  const createMockStripeControllerDeps = (isFailure?: boolean) => {
    const stripeControllerDepsMocked = {
      stripeService: {
        onWebHook: isFailure
          ? jest
              .fn()
              .mockRejectedValueOnce(new BadRequest('Test bad request error'))
          : jest.fn().mockResolvedValue(undefined)
      },
      logger: {
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn()
      }
    }

    for (const key in stripeControllerDepsMocked) {
      Reflect.set(
        stripeController,
        key,
        stripeControllerDepsMocked[
          key as keyof typeof stripeControllerDepsMocked
        ]
      )
    }

    return stripeControllerDepsMocked
  }

  beforeAll(async (): Promise<void> => {
    const testEnv = { ...env, USE_STRIPE: true }
    bindings = await createContainer(testEnv)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    stripeController = (await bindings.resolve(
      'stripeController'
    )) as StripeController
  })

  beforeEach(async (): Promise<void> => {
    await createReqRes()
    mockConstructEvent.mockReset()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    jest.resetAllMocks()
  })

  describe('onWebHook', () => {
    it('should verify webhook signature and process webhook successfully', async () => {
      const mockDeps = createMockStripeControllerDeps()

      // Successfully verify the signature
      mockConstructEvent.mockReturnValue({})

      await stripeController.onWebHook(req, res, next)

      expect(mockConstructEvent).toHaveBeenCalledWith(
        expect.any(Buffer),
        'mock-signature',
        env.STRIPE_WEBHOOK_SECRET
      )
      expect(mockDeps.stripeService.onWebHook).toHaveBeenCalledWith({
        id: 'webhookId123',
        type: EventType.payment_intent_succeeded,
        data: {
          object: {
            id: 'pi_123456',
            amount: 1000,
            currency: 'usd',
            metadata: {
              receiving_address: 'wallet_address_123'
            }
          }
        }
      })
      expect(res.statusCode).toBe(200)
    })

    it('should fail if stripe-signature header is missing', async () => {
      const mockDeps = createMockStripeControllerDeps()

      // Remove the signature header
      delete req.headers['stripe-signature']

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(mockConstructEvent).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })

    it('should fail if signature verification fails', async () => {
      const mockDeps = createMockStripeControllerDeps()

      // Signature verification fail
      mockConstructEvent.mockImplementation(() => {
        throw new BadRequest('Invalid stripe webhook signature')
      })

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(mockConstructEvent).toHaveBeenCalled()
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })

    it('should fail if webhook has unknown event type', async () => {
      const mockDeps = createMockStripeControllerDeps()

      // Successfully verify the signature
      mockConstructEvent.mockReturnValue({})

      // unknown event type
      req.body = Buffer.from(
        JSON.stringify({
          id: 'webhookId123',
          type: 'unknown_event_type',
          data: {
            object: {
              id: 'pi_123456',
              amount: 1000,
              currency: 'usd',
              metadata: {
                receiving_address: 'wallet_address_123'
              }
            }
          }
        })
      )

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(mockConstructEvent).toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })

    it('should fail if webhook has invalid data (missing required fields)', async () => {
      const mockDeps = createMockStripeControllerDeps()

      // Successfully verify the signature
      mockConstructEvent.mockReturnValue({})

      // (missing receiving_address)
      req.body = Buffer.from(
        JSON.stringify({
          id: 'webhookId123',
          type: EventType.payment_intent_succeeded,
          data: {
            object: {
              id: 'pi_123456',
              amount: 1000,
              currency: 'usd',
              metadata: {}
            }
          }
        })
      )

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(mockConstructEvent).toHaveBeenCalled()
      expect(next).toHaveBeenCalledTimes(1)
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })
  })
})
