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
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import type { UserService } from '@/user/service'
import { AssetController } from '@/asset/controller'
import { mockLogInRequest } from '../mocks'

describe('Asset Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userService: UserService
  let assetController: AssetController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    userService = await bindings.resolve('userService')
    assetController = await bindings.resolve('assetController')
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()

    req.body = args

    await userService.create(args)
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

  describe('list', (): void => {
    it("should return the user's list of assets (empty)", async (): Promise<void> => {
      await assetController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        // data: [],
        message: 'Success'
      })
    })
  })
})
