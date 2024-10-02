import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { CardController } from '@/card/controller'
import { BadRequest } from '@shared/backend'
import {
  ICardDetailsResponse,
  ICardResponse,
  IGetTransactionsResponse
} from '@/card/types'
import { AwilixContainer } from 'awilix'
import { Cradle } from '@/createContainer'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { Request, Response } from 'express'
import { env } from '@/config/env'
import { createContainer } from '@/createContainer'
import { AuthService } from '@/auth/service'
import { applyMiddleware } from '../utils'
import { withSession } from '@/middleware/withSession'
import { truncateTables } from '@shared/backend/tests'
import { mockLogInRequest } from '../mocks'
import { createUser } from '../helpers'
import { User } from '@/user/model'

describe('CardController', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let cardController: CardController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userId: string

  const mockCardService = {
    getCardsByCustomer: jest.fn(),
    getCardDetails: jest.fn(),
    getCardTransactions: jest.fn(),
    lock: jest.fn(),
    unlock: jest.fn(),
    getPin: jest.fn(),
    changePin: jest.fn()
  }

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
      needsIDProof: !user.kycVerified
    }

    req.params.cardId = 'test-card-id'

    userId = user.id
    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    cardController = await bindings.resolve('cardController')
  })

  beforeEach(async (): Promise<void> => {
    Reflect.set(cardController, 'cardService', mockCardService)

    await createUser({ ...args, isEmailVerified: true })
    await createReqRes()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
    jest.resetAllMocks()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  describe('getCardsByCustomer', () => {
    it('should get cards by customer successfully', async () => {
      const next = jest.fn()

      const mockedCards: ICardResponse[] = [
        {
          sourceId: '3dc96e41-279d-4355-921a-e1946e90e1ff',
          nameOnCard: 'Jane Doe',
          id: 'test-card-id',
          accountId: '469E3666F8914020B6B2604F7D4A10F6',
          accountSourceId: 'c44e6bc8-d0ef-491e-b374-6d09b6fa6332',
          maskedPan: '528700******9830',
          status: 'Active',
          statusReasonCode: null,
          lockLevel: null,
          expiryDate: '0929',
          customerId: 'customer-id',
          customerSourceId: 'a5aba6c7-b8ad-4cfe-98d5-497366a4ee2c',
          productCode: 'VMDTKPREB'
        }
      ]

      mockCardService.getCardsByCustomer.mockResolvedValue(mockedCards)

      req.params.customerId = 'customer-id'

      await cardController.getCardsByCustomer(req, res, next)

      expect(mockCardService.getCardsByCustomer).toHaveBeenCalledWith(
        'customer-id'
      )
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockedCards
      })
    })

    it('should return 400 if customerId is missing', async () => {
      const next = jest.fn()

      delete req.params.customerId

      await cardController.getCardsByCustomer(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })
  })

  describe('getCardDetails', () => {
    it('should get card details successfully', async () => {
      const next = jest.fn()

      req.query = { publicKeyBase64: 'test-public-key' }

      const mockedCardDetails: ICardDetailsResponse = {
        cipher: 'encrypted-card-data'
      }

      mockCardService.getCardDetails.mockResolvedValue(mockedCardDetails)

      await cardController.getCardDetails(req, res, next)

      expect(mockCardService.getCardDetails).toHaveBeenCalledWith(userId, {
        cardId: 'test-card-id',
        publicKeyBase64: 'test-public-key'
      })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockedCardDetails
      })
    })

    it('should return 400 if cardId is missing', async () => {
      const next = jest.fn()

      delete req.params.cardId

      await cardController.getCardDetails(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })

    it('should return 400 if publicKeyBase64 is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.query = {}

      await cardController.getCardDetails(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })
  })

  describe('getCardTransactions', () => {
    it('should get card transactions successfully', async () => {
      const next = jest.fn()

      const mockedTransactions: IGetTransactionsResponse = {
        data: [
          {
            id: 1,
            transactionId: '78b34171-0a7c-4185-9fd5-7c5f366ed50b',
            ghResponseCode: 'TRXNS',
            cardScheme: 3,
            type: 1,
            createdAt: '2024-02-01T00:00:00.000Z',
            txStatus: 'PROCESSING',
            vaultId: 1,
            cardId: 1,
            refTransactionId: '',
            responseCode: null,
            transactionAmount: '1.1',
            transactionCurrency: 'EUR',
            billingAmount: '1.1',
            billingCurrency: 'EUR',
            terminalId: null,
            wallet: 123,
            transactionDateTime: '2024-02-01T00:00:00.000Z',
            processDateTime: null
          },
          {
            id: 2,
            transactionId: '545b34171-0a7c-4185-9fd5-7c5f366e4566',
            ghResponseCode: 'TRXNS',
            cardScheme: 3,
            type: 1,
            createdAt: '2024-02-01T00:00:00.000Z',
            txStatus: 'PROCESSING',
            vaultId: 1,
            cardId: 1,
            refTransactionId: '',
            responseCode: null,
            transactionAmount: '1.1',
            transactionCurrency: 'EUR',
            billingAmount: '1.1',
            billingCurrency: 'EUR',
            terminalId: null,
            wallet: 123,
            transactionDateTime: '2024-02-01T00:00:00.000Z',
            processDateTime: null
          }
        ],
        pagination: {
          pageNumber: 1,
          pageSize: 10,
          totalRecords: 2,
          totalPages: 1
        }
      }

      mockCardService.getCardTransactions.mockResolvedValue(mockedTransactions)

      req.params = { cardId: 'test-card-id' }
      req.query = { pageSize: '10', pageNumber: '1' }

      await cardController.getCardTransactions(req, res, next)

      expect(mockCardService.getCardTransactions).toHaveBeenCalledWith(
        userId,
        'test-card-id',
        10,
        1
      )
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockedTransactions
      })
    })
    it('should return 400 if page size is invalid', async () => {
      const next = jest.fn()

      req.params = { cardId: 'test-card-id' }
      // Invalid pageSize
      req.query = { pageSize: '-1', pageNumber: '1' }

      await cardController.getCardTransactions(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toEqual({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('lock', () => {
    it('should lock card successfully', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.body = { note: 'Lost my card' }
      req.query = { reasonCode: 'LostCard' }

      const mockResult = { status: 'locked' }
      mockCardService.lock.mockResolvedValue(mockResult)

      await cardController.lock(req, res, next)

      expect(mockCardService.lock).toHaveBeenCalledWith(
        'test-card-id',
        'LostCard',
        {
          note: 'Lost my card'
        }
      )

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockResult
      })
    })

    it('should return 400 if reasonCode is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.body = { note: 'Lost my card' }
      delete req.query.reasonCode

      await cardController.lock(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalledWith(expect.any(BadRequest))
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('should return 400 if reasonCode is invalid', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.query.reasonCode = 'InvalidCode'
      req.body = { note: 'Lost my card' }

      await cardController.lock(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalledWith(expect.any(BadRequest))
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('should return 400 if note is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.query.reasonCode = 'LostCard'
      req.body = {}

      await cardController.lock(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalledWith(expect.any(BadRequest))
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('unlock', () => {
    it('should unlock the card successfully', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.body = { note: 'Found my card' }

      const mockResult = { status: 'unlocked' }
      mockCardService.unlock.mockResolvedValue(mockResult)

      await cardController.unlock(req, res, next)

      expect(mockCardService.unlock).toHaveBeenCalledWith('test-card-id', {
        note: 'Found my card'
      })

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockResult
      })
    })

    it('should return 400 if note is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.body = {}

      await cardController.unlock(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalledWith(expect.any(BadRequest))
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('getPin', () => {
    it('should get pin successfully', async () => {
      const next = jest.fn()

      req.query = { publicKeyBase64: 'test-public-key' }

      const mockedCardDetails: ICardDetailsResponse = {
        cipher: 'encrypted-card-pin'
      }

      mockCardService.getPin.mockResolvedValue(mockedCardDetails)

      await cardController.getPin(req, res, next)

      expect(mockCardService.getPin).toHaveBeenCalledWith(userId, {
        cardId: 'test-card-id',
        publicKeyBase64: 'test-public-key'
      })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: mockedCardDetails
      })
    })

    it('should return 400 if cardId is missing', async () => {
      const next = jest.fn()

      delete req.params.cardId

      await cardController.getPin(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })

    it('should return 400 if publicKeyBase64 is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.query = {}

      await cardController.getPin(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })
  })

  describe('changePin', () => {
    it('should change pin successfully', async () => {
      const next = jest.fn()
      req.params.cardId = 'test-card-id'
      req.body = {
        cypher: 'test-cypher'
      }

      mockCardService.changePin.mockResolvedValue({})

      await cardController.changePin(req, res, next)

      expect(mockCardService.changePin).toHaveBeenCalledWith(
        userId,
        'test-card-id',
        'test-cypher'
      )
      expect(res.statusCode).toBe(201)
      expect(res._getJSONData()).toEqual({
        success: true,
        message: 'SUCCESS',
        result: {}
      })
    })

    it('should return 400 if cardId is missing', async () => {
      const next = jest.fn()

      delete req.params.cardId

      await cardController.changePin(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })

    it('should return 400 if cypher is missing', async () => {
      const next = jest.fn()

      req.params.cardId = 'test-card-id'
      req.body = {}

      await cardController.changePin(req, res, (err) => {
        next(err)
        res.status(err.statusCode).json({
          success: false,
          message: err.message
        })
      })

      expect(next).toHaveBeenCalled()
      const error = next.mock.calls[0][0]
      expect(error).toBeInstanceOf(BadRequest)
      expect(error.message).toBe('Invalid input')
      expect(res.statusCode).toBe(400)
    })
  })
})
