import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { createApp, TestApp } from '@/tests/app'
import { Knex } from 'knex'
import { truncateTables } from '@shared/backend/tests'
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
import { AssetController } from '@/asset/controller'
import { mockedListAssets, mockLogInRequest } from '../mocks'
import { createUser } from '@/tests/helpers'
import { AwilixContainer } from 'awilix'

describe('Asset Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let assetController: AssetController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    assetController = await bindings.resolve('assetController')
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
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified
    }
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('list', (): void => {
    it('should return the list of assets', async (): Promise<void> => {
      const depsMocked = {
        rafikiClient: {
          listAssets: () => mockedListAssets
        }
      }
      Reflect.set(assetController, 'rafikiClient', depsMocked.rafikiClient)

      await assetController.list(req, res, next)
      expect(res.statusCode).toBe(200)
      const jsonData = res._getJSONData()
      expect(jsonData).toMatchObject({
        message: 'SUCCESS'
      })
      expect(jsonData?.result?.length).toEqual(mockedListAssets.length)
    })
  })
})
