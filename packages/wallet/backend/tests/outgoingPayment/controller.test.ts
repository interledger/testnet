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
import { mockLogInRequest } from '../mocks'
import { createUser } from '@/tests/helpers'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'

describe('outgoingPayment Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let outgoingPaymentController: OutgoingPaymentController
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    outgoingPaymentController = await bindings.resolve(
      'outgoingPaymentController'
    )
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

  describe('create', (): void => {
    it('should create quote by id', async (): Promise<void> => {
      const depsMocked = {
        outgoingPaymentService: {
          createByQuoteId: () => {}
        }
      }
      Reflect.set(outgoingPaymentController, 'deps', depsMocked)

      await outgoingPaymentController.create(req, res, next)
      expect(res.statusCode).toBe(200)
    })
  })
})
