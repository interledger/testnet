import { createContainer } from '@/index'
import { Bindings } from '@/app'
import { env } from '@/config/env'
import { Container } from '@/container'
import { createApp, TestApp } from '../app'
import { Knex } from 'knex'
import { truncateTables } from '../tables'
import { Request, Response } from 'express'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
// import type { AuthController } from '@/auth/controller'
import type { AuthService } from '@/auth/service'
import { errorHandler } from '@/middleware/errorHandler'
import { faker } from '@faker-js/faker'
import { applyMiddleware, uuid } from '../utils'
import { withSession } from '@/middleware/withSession'
import type { UserService } from '@/user/service'
import type { UserController } from '@/user/controller'

describe('User Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  // let authController: AuthController
  let userService: UserService
  let userController: UserController
  let request: MockRequest<Request>
  let response: MockResponse<Response>

  const nextFunction = jest.fn()
  const args = {
    email: faker.internet.email(),
    password: faker.internet.password()
  }

  beforeAll(async (): Promise<void> => {
    bindings = createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    // authController = await bindings.resolve('authController')
    userService = await bindings.resolve('userService')
    userController = await bindings.resolve('userController')
  })

  beforeEach(async (): Promise<void> => {
    response = createResponse()
    request = createRequest()

    request.body = {
      ...args
    }

    await userService.create(args)
    await applyMiddleware(withSession, request, response)

    const { user, session } = await authService.authorize(args)
    request.session.id = session.id
    request.session.user = {
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
    it('returns the user information if the session is valid', async (): Promise<void> => {
      await userController.me(request, response, nextFunction)
      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toMatchObject({
        success: true,
        message: 'User retrieved successfully',
        data: {
          email: args.email
        }
      })
    })

    it('it returns 404 if the session is not found', async (): Promise<void> => {
      request.session.id = uuid()
      await userController.me(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })
      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(404)
      expect(request.session).toEqual({})
    })

    it('it returns 404 if the user is not found', async (): Promise<void> => {
      request.session.user.id = uuid()
      await userController.me(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })
      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(404)
      expect(request.session).toEqual({})
    })
  })
})
