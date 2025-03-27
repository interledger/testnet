import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { StripeController } from '@/stripe/controller'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { errorHandler } from '@/tests/helpers'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { EventType } from '@/stripe/service'

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

    await applyMiddleware(withSession, req, res)
  }

  const createMockStripeControllerDeps = (isFailure?: boolean) => {
    const stripeControllerDepsMocked = {
      stripeService: {
        onWebHook: isFailure
          ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
          : jest.fn()
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
        stripeControllerDepsMocked[key as keyof typeof stripeControllerDepsMocked]
      )
    }

    return stripeControllerDepsMocked
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    stripeController = await bindings.resolve('stripeController')
  })

  beforeEach(async (): Promise<void> => {
    await createReqRes()
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
    it('should process webhook successfully if it has correct type and required fields', async () => {
      const mockDeps = createMockStripeControllerDeps()

      req.body = {
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
      }

      await stripeController.onWebHook(req, res, next)

      expect(mockDeps.stripeService.onWebHook).toHaveBeenCalledWith(req.body)
      expect(res.statusCode).toBe(200)
    })

    it('should fail if webhook has unknown event type', async () => {
      const mockDeps = createMockStripeControllerDeps()

      req.body = {
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
      }

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })

    it('should fail if webhook has invalid data (missing required fields)', async () => {
      const mockDeps = createMockStripeControllerDeps()

      req.body = {
        id: 'webhookId123',
        type: EventType.payment_intent_succeeded,
        data: {
          object: {
            id: 'pi_123456',
            amount: 1000,
            currency: 'usd',
            // Missing receiving_address in metadata
            metadata: {}
          }
        }
      }

      await stripeController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(mockDeps.logger.error).toHaveBeenCalled()
      expect(res.statusCode).toBe(400)
      expect(mockDeps.stripeService.onWebHook).not.toHaveBeenCalled()
    })
  })
})
