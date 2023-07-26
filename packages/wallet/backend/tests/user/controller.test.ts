import { createContainer } from '@/createContainer'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/shared/container'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@/tests/tables'
import { Request, Response } from 'express'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import type { AuthService } from '@/auth/service'
import { errorHandler } from '@/middleware/errorHandler'
import { applyMiddleware, uuid } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import type { UserController } from '@/user/controller'
import { mockLogInRequest } from '../mocks'
import { createUser } from '@/tests/helpers'

describe('User Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userController: UserController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    userController = await bindings.resolve('userController')
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()

    req.body = args

    await createUser({ ...args, isEmailVerified: true })
    await applyMiddleware(withSession, req, res)

    const { user, session } = await authService.authorize(args)
    req.session.id = session.id
    req.session.user = {
      id: user.id,
      email: user.email,
      needsWallet: !user.rapydWalletId,
      needsIDProof: !user.kycId
    }
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('me', (): void => {
    it('should return the user information if the session is valid', async (): Promise<void> => {
      await userController.me(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'User retrieved successfully',
        data: {
          needsIDProof: true,
          needsWallet: true
        }
      })
    })

    it('should return 404 if the user is not found', async (): Promise<void> => {
      req.session.user.id = uuid()
      await userController.me(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(401)
      expect(req.session).toEqual({})
    })
  })
})
