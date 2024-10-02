import { env } from '@/config/env'
import { Cradle, createContainer } from '@/createContainer'
import { AuthService } from '@/auth/service'
import { NextFunction, Request, Response } from 'express'
import { createApp, TestApp } from '@/tests/app'
import {
  MockRequest,
  MockResponse,
  createRequest,
  createResponse
} from 'node-mocks-http'
import { mockLogInRequest } from '@/tests/mocks'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { createUser } from '@/tests/helpers'
import { GateHubController } from '@/gatehub/controller'
import { truncateTables } from '@shared/backend/tests'
import { AwilixContainer } from 'awilix'
import { Knex } from 'knex'
//import { NotFound } from '@shared/backend/'

describe('GateHub Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let authService: AuthService
  let gateHubController: GateHubController
  //let userId: string

  const mockGateHubService = {
    getIframeUrl: jest.fn(),
    handleWebhook: jest.fn(),
    addUserToGateway: jest.fn()
  }

  const args = mockLogInRequest().body

  const next = jest.fn() as unknown as NextFunction

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

    await User.query().patchAndFetchById(user.id, { gateHubUserId: 'mocked' })
  }

  beforeAll(async () => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    gateHubController = await bindings.resolve('gateHubController')
  })

  beforeEach(async (): Promise<void> => {
    Reflect.set(gateHubController, 'gateHubService', mockGateHubService)
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

  describe('GetIframeUrl', () => {
    it('should call method GetIframeUrl() successfully', async () => {
      req.params = {
        type: 'withdrawal'
      }
      const mockedIframeUrl = 'URL'
      mockGateHubService.getIframeUrl.mockResolvedValue(mockedIframeUrl)

      await gateHubController.getIframeUrl(req, res, next)

      expect(mockGateHubService.getIframeUrl).toHaveBeenCalledWith(
        'withdrawal',
        req.session.user.id
      )
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS',
        result: {
          url: mockedIframeUrl
        }
      })
    })
  })

  describe('addUserToGateway', () => {
    it('should call method gateHubService.addUserToGateway() successfully and have a success result', async () => {
      const mockedAddUserToGatewayResponse = true
      mockGateHubService.addUserToGateway.mockResolvedValue(
        mockedAddUserToGatewayResponse
      )

      await gateHubController.addUserToGateway(req, res, next)

      expect(mockGateHubService.addUserToGateway).toHaveBeenCalledWith(
        req.session.user.id
      )
      expect(res.statusCode).toBe(200)
      expect(req.session.user.needsIDProof).toBe(false)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS'
      })
    })
    it('should call method gateHubService.addUserToGateway() but return a false result', async () => {
      const next = jest.fn()
      const mockedAddUserToGatewayResponse = false
      mockGateHubService.addUserToGateway.mockResolvedValue(
        mockedAddUserToGatewayResponse
      )

      await gateHubController.addUserToGateway(req, res, next)

      expect(mockGateHubService.addUserToGateway).toHaveBeenCalledWith(
        req.session.user.id
      )
      expect(res.statusCode).toBe(200)
      expect(req.session.user.needsIDProof).toBe(true)
      expect(res._getJSONData()).toMatchObject({
        message: 'SUCCESS'
      })
    })
  })

  describe('webhook action tests', () => {
    it('should call method gateHubService.webhook() successfully and have a success result', async () => {
      req.body = {
        uuid: 1
      }
      mockGateHubService.handleWebhook.mockResolvedValue(req.body)

      await gateHubController.webhook(req, res, next)

      expect(mockGateHubService.handleWebhook).toHaveBeenCalledWith(req.body)
      expect(res.statusCode).toBe(200)
      expect(res._getData()).toMatch('')
    })
    // TO DO more after signature check is implemented
  })
})
