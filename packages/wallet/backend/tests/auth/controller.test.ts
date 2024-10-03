import { Cradle, createContainer } from '@/createContainer'
import { env } from '@/config/env'
import { envRateLimit } from '@/config/rateLimit'
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
import type { AuthController } from '@/auth/controller'
import type { AuthService } from '@/auth/service'
import { applyMiddleware } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import { getRedisClient } from '@/config/redis'
import { rateLimiterLogin, rateLimiterEmail } from '@/middleware/rateLimit'
import type { UserService } from '@/user/service'
import {
  fakeLoginData,
  mockGateHubClient,
  mockLogInRequest,
  mockSignUpRequest
} from '../mocks'
import { createUser, errorHandler } from '@/tests/helpers'
import { AwilixContainer } from 'awilix'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { GateHubClient } from '@/gatehub/client'
import { BaseError } from '@shared/backend'

describe('Authentication Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let authController: AuthController
  let userService: UserService
  let req: MockRequest<Request>
  let res: MockResponse<Response>

  const rateLimit = envRateLimit()
  const next = jest.fn()

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    authService = await bindings.resolve('authService')
    authController = await bindings.resolve('authController')
    userService = await bindings.resolve('userService')

    Reflect.set(
      userService,
      'gateHubClient',
      mockGateHubClient as unknown as GateHubClient
    )
  })

  beforeEach(async (): Promise<void> => {
    res = createResponse()
    req = createRequest()
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
    const redisClient = getRedisClient(env)
    redisClient?.disconnect()
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
        needsWallet: !user.gateHubUserId,
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

    it('should return status 500 on user account is not verified', async (): Promise<void> => {
      const fakeLogin = fakeLoginData()
      const newUserData = {
        ...fakeLogin,
        isEmailVerified: false
      }
      req.body = fakeLogin
      await createUser(newUserData)
      const authorizeSpy = jest
        .spyOn(authService, 'authorize')
        .mockRejectedValueOnce(new Error('Email address is not verified.'))
      await applyMiddleware(withSession, req, res)
      await authController.logIn(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(authorizeSpy).toHaveBeenCalledWith(fakeLogin)
      expect(authorizeSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
    it('should return status 429 (rate limit) if the user login rate limit is reached', async (): Promise<void> => {
      if (!rateLimit.RATE_LIMIT) {
        return
      }
      const fakeLogin = fakeLoginData()
      const newUserData = {
        ...fakeLogin,
        isEmailVerified: true
      }
      await createUser(newUserData)
      req.body = { ...fakeLogin, password: 'invalid' }

      let failedLoginResp: MockResponse<Response>
      for (let i = 0; i < rateLimit.LOGIN_RATE_LIMIT; i++) {
        failedLoginResp = createResponse()
        await applyMiddleware(rateLimiterLogin, req, failedLoginResp)
        await authController.logIn(req, failedLoginResp, (err) => {
          next()
          errorHandler(err, req, failedLoginResp, next)
        })
        expect(next).toHaveBeenCalledTimes(i + 1)
        expect(failedLoginResp.statusCode).toBe(401)
      }

      try {
        await applyMiddleware(rateLimiterLogin, req, res)
        await authController.logIn(req, res, next)
      } catch (err) {
        expect((err as BaseError).statusCode).toBe(429)
        expect((err as BaseError).message).toMatch(
          `Too many attempts. Retry after ${rateLimit.LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS / 60} minutes`
        )
      }
    })
  })

  describe('Log out', () => {
    it('should return status 200 if the user is logged out', async () => {
      const args = mockLogInRequest().body
      const logOutSpy = jest.spyOn(authService, 'logout')
      await createUser({ ...args, isEmailVerified: true })
      await applyMiddleware(withSession, req, res)
      const { user, session } = await authService.authorize(args)
      req.session.id = session.id
      req.session.user = {
        id: user.id,
        email: user.email,
        needsWallet: !user.gateHubUserId,
        needsIDProof: !user.kycId
      }
      await authController.logOut(req, res, next)

      expect(logOutSpy).toHaveBeenCalledWith(user.id)
      expect(next).toHaveBeenCalledTimes(0)
      expect(req.session.id).toBeUndefined()
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS'
      })
    })
    it('should return status 401 if the request body is not valid', async (): Promise<void> => {
      await applyMiddleware(withSession, req, res)
      await authController.logOut(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(401)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Unauthorized'
      })
    })

    it('should return status 500 on unexpected error', async (): Promise<void> => {
      const logoutSpy = jest
        .spyOn(authService, 'logout')
        .mockRejectedValueOnce(new Error('Unexpected error'))

      const args = mockLogInRequest().body
      await applyMiddleware(withSession, req, res)
      await createUser({ ...args, isEmailVerified: true })

      const { user, session } = await authService.authorize(args)
      req.session.id = session.id
      req.session.user = {
        id: user.id,
        email: user.email,
        needsWallet: !user.gateHubUserId,
        needsIDProof: !user.kycId
      }
      await authController.logOut(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(logoutSpy).toHaveBeenCalledTimes(1)
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(500)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })

  describe('Verify email', () => {
    it('should return 200 if the email has successfully verified', async () => {
      const emailToken = getRandomToken()
      const args = mockLogInRequest().body
      await createUser({ ...args, verifyEmailToken: hashToken(emailToken) })
      req.params = {
        token: emailToken
      }
      await authController.verifyEmail(req, res, next)

      expect(next).toHaveBeenCalledTimes(0)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Email was verified successfully'
      })
    })

    it('should return status 400 if the request body is not valid', async () => {
      req.params = {
        token: 'invalid-token'
      }
      await authController.verifyEmail(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid token'
      })
    })
  })
  describe('Resend Verify Email', () => {
    it('should return status 200 if the email has been sent', async (): Promise<void> => {
      const fakeLogin = fakeLoginData()
      const newUserData = {
        ...fakeLogin,
        isEmailVerified: false
      }
      await createUser(newUserData)

      req.body = {
        email: fakeLogin.email
      }
      await authController.resendVerifyEmail(req, res, next)

      expect(next).toHaveBeenCalledTimes(0)
      expect(res.statusCode).toBe(201)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Verification email has been sent successfully'
      })
    })

    it('should return 429 (rate limit) if the endpoint to resend verify email is called twice ', async () => {
      if (!rateLimit.RATE_LIMIT) {
        return
      }
      const fakeLogin = fakeLoginData()
      const newUserData = {
        ...fakeLogin,
        isEmailVerified: false
      }
      await createUser(newUserData)

      req.body = {
        email: fakeLogin.email
      }
      await applyMiddleware(rateLimiterEmail, req, res)
      await authController.resendVerifyEmail(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.statusCode).toBe(201)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Verification email has been sent successfully'
      })
      try {
        const limitReachedResp: MockResponse<Response> = createResponse()
        await applyMiddleware(rateLimiterEmail, req, limitReachedResp)
        await authController.resendVerifyEmail(req, limitReachedResp, next)
      } catch (err) {
        expect((err as BaseError).statusCode).toBe(429)
        expect((err as BaseError).message).toMatch(
          `Too many attempts. Retry after ${rateLimit.SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS / 60} minutes`
        )
      }
    })
  })
})
