import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
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
import type { AuthController } from '@/auth/controller'
import type { AuthService } from '@/auth/service'
import { errorHandler } from '@/middleware/errorHandler'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import type { UserService } from '@/user/service'
import { fakeLoginData, mockLogInRequest, mockSignUpRequest } from '../mocks'
import { createUser } from '@/tests/helpers'
import { AwilixContainer } from 'awilix'

describe('Authentication Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let authController: AuthController
  let userService: UserService
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const next = jest.fn()

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    authController = await bindings.resolve('authController')
    userService = await bindings.resolve('userService')
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Sign Up', (): void => {
    it('should return status 201 if the user is created', async (): Promise<void> => {
      req.body = mockSignUpRequest().body
      await authController.signUp(req, res, next)

      expect(next).toHaveBeenCalledTimes(0)
      expect(res.statusCode).toBe(201)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'User created successfully'
      })
    })

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = mockSignUpRequest({
        confirmPassword: 'not-the-same'
      }).body

      await authController.signUp(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('should return status 500 on unexpected error', async (): Promise<void> => {
      req.body = mockSignUpRequest().body

      const createSpy = jest
        .spyOn(userService, 'create')
        .mockRejectedValueOnce(new Error('Unexpected error'))
      await authController.signUp(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })

  describe('Log In', (): void => {
    it('should return status 200 if the user is authorized', async (): Promise<void> => {
      const fakeLogin = fakeLoginData()
      const newUserData = {
        ...fakeLogin,
        isEmailVerified: true
      }
      const user = await createUser(newUserData)

      req.body = fakeLogin

      const authorizeSpy = jest.spyOn(authService, 'authorize')
      await applyMiddleware(withSession, req, res)
      await authController.logIn(req, res, next)

      expect(authorizeSpy).toHaveBeenCalledWith(fakeLogin)
      expect(next).toHaveBeenCalledTimes(0)
      expect(req.session.id).toBeDefined()
      expect(req.session.user).toMatchObject({
        id: user.id,
        email: user.email,
        needsWallet: !user.rapydWalletId,
        needsIDProof: !user.kycId
      })
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Authorized'
      })
    })

    it('should return status 400 if the request body is not valid', async (): Promise<void> => {
      req.body = mockLogInRequest({ email: 'not-an-email' }).body

      await authController.logIn(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('should return status 500 on unexpected error', async (): Promise<void> => {
      req.body = mockLogInRequest().body

      const authorizeSpy = jest
        .spyOn(authService, 'authorize')
        .mockRejectedValueOnce(new Error('Unexpected error'))
      await authController.logIn(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(authorizeSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })
})
