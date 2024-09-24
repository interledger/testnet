import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { CardController } from '@/card/controller'
import { NotFound } from '@shared/backend'
import { IMaskedCardDetailsResponse, ICardDetailsResponse } from '@/card/types'
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
    getMaskedCardDetails: jest.fn(),
    getCardDetails: jest.fn()
  }

  const mockWalletAddressService = {
    getByCardId: jest.fn()
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
      needsIDProof: !user.kycId
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
    Reflect.set(
      cardController,
      'walletAddressService',
      mockWalletAddressService
    )

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

  it('should get masked card details successfully', async () => {
    const next = jest.fn()

    const mockedWalletAddress = {
      id: 'wallet-address-id',
      cardId: 'test-card-id'
    }
    const mockedMaskedCardDetails: IMaskedCardDetailsResponse = {
      sourceId: null,
      nameOnCard: 'John Doe',
      productCode: 'PROD123',
      id: 'card-id',
      accountId: 'account-id',
      accountSourceId: 'account-source-id',
      maskedPan: '**** **** **** 1234',
      status: 'Active',
      statusReasonCode: null,
      lockLevel: null,
      expiryDate: '12/25',
      customerId: 'customer-id',
      customerSourceId: 'customer-source-id'
    }

    mockWalletAddressService.getByCardId.mockResolvedValue(mockedWalletAddress)
    mockCardService.getMaskedCardDetails.mockResolvedValue(
      mockedMaskedCardDetails
    )

    await cardController.getMaskedCardDetails(req, res, next)

    expect(mockWalletAddressService.getByCardId).toHaveBeenCalledWith(
      userId,
      'test-card-id'
    )
    expect(mockCardService.getMaskedCardDetails).toHaveBeenCalledWith(
      'test-card-id'
    )
    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'SUCCESS',
      result: mockedMaskedCardDetails
    })
  })

  it('should return 404 if card is not associated with user', async () => {
    const next = jest.fn()

    mockWalletAddressService.getByCardId.mockResolvedValue(null)

    await cardController.getMaskedCardDetails(req, res, next)

    expect(mockWalletAddressService.getByCardId).toHaveBeenCalledWith(
      userId,
      'test-card-id'
    )
    expect(next).toHaveBeenCalledWith(
      new NotFound('Card not found or not associated with the user.')
    )
  })

  it('should get card details successfully', async () => {
    req.params.publicKeyBase64 = 'test-public-key'

    const next = jest.fn()

    const mockedWalletAddress = {
      id: 'wallet-address-id',
      cardId: 'test-card-id'
    }
    const mockedCardDetails: ICardDetailsResponse = {}

    mockWalletAddressService.getByCardId.mockResolvedValue(mockedWalletAddress)
    mockCardService.getCardDetails.mockResolvedValue(mockedCardDetails)

    await cardController.getCardDetails(req, res, next)

    expect(mockWalletAddressService.getByCardId).toHaveBeenCalledWith(
      userId,
      'test-card-id'
    )
    expect(mockCardService.getCardDetails).toHaveBeenCalledWith(
      'test-card-id',
      'test-public-key'
    )
    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'SUCCESS',
      result: mockedCardDetails
    })
  })

  it('should return 404 if card is not associated with user', async () => {
    req.params.publicKeyBase64 = 'test-public-key'

    const next = jest.fn()

    mockWalletAddressService.getByCardId.mockResolvedValue(null)

    await cardController.getCardDetails(req, res, next)

    expect(mockWalletAddressService.getByCardId).toHaveBeenCalledWith(
      userId,
      'test-card-id'
    )
    expect(next).toHaveBeenCalledWith(
      new NotFound('Card not found or not associated with the user.')
    )
  })
})
