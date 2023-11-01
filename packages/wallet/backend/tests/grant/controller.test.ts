import { Container } from '@/shared/container'
import { Bindings } from '@/app'
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
import { mockLogInRequest } from '@/tests/mocks'
import { GrantController } from '@/grant/controller'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { User } from '@/user/model'
import { faker } from '@faker-js/faker'
import { createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createUser } from '@/tests/helpers'
import { truncateTables } from '@/tests/tables'
import { errorHandler } from '@/middleware/errorHandler'

describe('Grant Controller', () => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let grantController: GrantController
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
      needsWallet: !user.rapydWalletId,
      needsIDProof: !user.kycId
    }
    await User.query().patchAndFetchById(user.id, { rapydWalletId: 'mocked' })
  }

  const createMockGrantControllerDeps = (isFailure?: boolean) => {
    const grantControllerDepsMocked = {
      rafikiAuthService: {
        listGrants: jest.fn().mockReturnValue(['grant1']),
        revokeGrant: isFailure
          ? jest.fn().mockRejectedValueOnce(new Error('Unexpected error'))
          : jest.fn(),
        getGrantById: jest.fn().mockReturnValue({ id: 'grant' })
      },
      grantService: {
        getGrantByInteraction: jest.fn().mockReturnValue({ id: 'grant' }),
        setInteractionResponse: jest.fn().mockReturnValue({ id: 'grant' })
      },
      walletAddressService: {
        listIdentifiersByUserId: () => faker.lorem.words(5).split(' ')
      }
    }
    Reflect.set(grantController, 'deps', grantControllerDepsMocked)
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    grantController = await bindings.resolve('grantController')

    createMockGrantControllerDeps()
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
    createMockGrantControllerDeps()
  })

  describe('Get list of grants', () => {
    it('should return array', async () => {
      await grantController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Success',
        data: ['grant1']
      })
    })
  })

  describe('Revoke Grant', () => {
    it('should return undefined', async () => {
      req.params = {
        id: faker.string.uuid()
      }
      await grantController.revoke(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Success'
      })
    })

    it('should fail with status 500 on unexpected error', async () => {
      createMockGrantControllerDeps(true)
      req.params = {
        id: faker.string.uuid()
      }
      await grantController.revoke(req, res, (err) => {
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
  })

  describe('Get By Id', () => {
    it('should return a grant', async () => {
      await grantController.getById(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Success',
        data: { id: 'grant' }
      })
    })
  })

  describe('Get By Interaction', () => {
    it('should return a grant', async () => {
      req.params = {
        interactionId: faker.string.uuid(),
        nonce: faker.string.uuid()
      }
      await grantController.getByInteraction(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Success',
        data: { id: 'grant' }
      })
    })
  })

  describe('Set Interaction Response', () => {
    it('should return a grant', async () => {
      req.body = {
        response: 'accept'
      }
      await grantController.setInteractionResponse(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Success',
        data: { id: 'grant' }
      })
    })
  })
})
