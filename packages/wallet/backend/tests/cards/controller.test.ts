import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { CardController } from '@/card/controller'
import { BadRequest } from '@shared/backend'
import { ICardDetailsResponse, ICardResponse } from '@/card/types'
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
    getCardDetails: jest.fn()
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

  it('should get card details successfully', async () => {
    const next = jest.fn()

    req.body = { publicKeyBase64: 'test-public-key' }

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

  it('should return 400 if publicKeyBase64 is missing', async () => {
    const next = jest.fn()

    req.params.cardId = 'test-card-id'
    req.body = {}

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
