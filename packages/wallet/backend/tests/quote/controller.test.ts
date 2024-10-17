import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { AuthService } from '@/auth/service'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { Request, Response } from 'express'
import { QuoteController } from '@/quote/controller'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { faker } from '@faker-js/faker'
import { createUser, errorHandler } from '@/tests/helpers'
import { truncateTables } from '@shared/backend/tests'
import { mockCreateQuoteRequest, mockLogInRequest } from '@/tests/mocks'
import { AwilixContainer } from 'awilix'

describe('Quote Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let quoteController: QuoteController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()
  const args = mockLogInRequest().body

  const createReqRes = async () => {
    res = createResponse()
    req = createRequest()

    await applyMiddleware(withSession, req, res)

    const { user, session } = await authService.authorize(args)
    req.session.id = session.id
    req.session.user = {
      id: user.id,
      email: user.email,
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified,
      customerId: user.customerId
    }
    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  const createMockQuoteControllerDeps = (isFailure?: boolean) => {
    const quoteWithFees = isFailure
      ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
      : () => ({
          debitAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          receiveAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          fee: {
            value: 100,
            assetCode: 'BRG',
            assetScale: 2
          }
        })
    const quoteControllerDepsMocked = {
      quoteService: {
        create: quoteWithFees,
        createExchangeQuote: quoteWithFees
      }
    }
    Reflect.set(
      quoteController,
      'quoteService',
      quoteControllerDepsMocked.quoteService
    )
  }
  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    quoteController = await bindings.resolve('quoteController')

    createMockQuoteControllerDeps()
  })

  beforeEach(async (): Promise<void> => {
    await createUser({ ...args, isEmailVerified: true })
    await createReqRes()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    createMockQuoteControllerDeps()
  })

  describe('Create Quote', () => {
    it('should return QuoteWithFees', async () => {
      req.body = mockCreateQuoteRequest().body
      await quoteController.create(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS',
        result: {
          debitAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          receiveAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          fee: {
            value: 100,
            assetCode: 'BRG',
            assetScale: 2
          }
        }
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createMockQuoteControllerDeps(true)
      req.body = mockCreateQuoteRequest().body

      await quoteController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = mockCreateQuoteRequest({ amount: -33 }).body
      delete req.body.zip

      await quoteController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('create exchange quote', () => {
    it('should return QuoteWithFees', async () => {
      req.body = {
        assetCode: faker.finance.currencyCode(),
        amount: Number(faker.finance.amount({ dec: 0 }))
      }

      await quoteController.createExchangeQuote(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS',
        result: {
          debitAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          receiveAmount: {
            assetCode: 'BRG',
            assetScale: 2,
            value: 100
          },
          fee: {
            value: 100,
            assetCode: 'BRG',
            assetScale: 2
          }
        }
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createMockQuoteControllerDeps(true)
      req.body = {
        assetCode: faker.finance.currencyCode(),
        amount: Number(faker.finance.amount({ dec: 0 }))
      }

      await quoteController.createExchangeQuote(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      await quoteController.createExchangeQuote(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })
})
