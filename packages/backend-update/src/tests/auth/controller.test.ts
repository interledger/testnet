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
import { AuthController } from '@/auth/controller'
import { AuthService } from '@/auth/service'
import { errorHandler } from '@/middleware/errorHandler'
import { faker } from '@faker-js/faker'
import { applyMiddleware } from '../utils'
import { withSession } from '@/middleware/withSession'

describe('Authentication Controller', (): void => {
  let bindings: Container<Bindings>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let authController: AuthController
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
    authController = await bindings.resolve('authController')
  })

  beforeEach(async (): Promise<void> => {
    response = createResponse()
    request = createRequest()
  })

  afterAll(async (): Promise<void> => {
    appContainer.stop()
    knex.destroy()
  })

  afterEach(async (): Promise<void> => {
    await truncateTables(knex)
  })

  describe('Sign Up', (): void => {
    it('returns status 201 if the user is created', async (): Promise<void> => {
      request.body = {
        ...args,
        confirmPassword: args.password
      }

      const createSpy = jest.spyOn(authService, 'createUser')
      await authController.signUp(request, response, nextFunction)

      expect(createSpy).toHaveBeenCalledWith(args)
      expect(nextFunction).toHaveBeenCalledTimes(0)
      expect(response.statusCode).toBe(201)
      expect(response._getJSONData()).toMatchObject({
        success: true,
        message: 'User created successfully'
      })
    })

    it('returns status 400 if the request body is not valid', async (): Promise<void> => {
      request.body = {
        ...args,
        confirmPassword: 'not-the-same'
      }

      await authController.signUp(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })

      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('returns status 500 on unexpected error', async (): Promise<void> => {
      request.body = {
        ...args,
        confirmPassword: args.password
      }

      const createSpy = jest
        .spyOn(authService, 'createUser')
        .mockRejectedValueOnce(new Error('Unexpected error'))
      await authController.signUp(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })

      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(500)
      expect(response._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })

  describe('Log In', (): void => {
    it('returns status 200 if the user is authorized', async (): Promise<void> => {
      request.body = {
        ...args
      }

      const user = await authService.createUser(args)
      const authorizeSpy = jest.spyOn(authService, 'authorize')
      await applyMiddleware(withSession, request, response)
      await authController.logIn(request, response, nextFunction)

      expect(authorizeSpy).toHaveBeenCalledWith(args)
      expect(nextFunction).toHaveBeenCalledTimes(0)
      expect(request.session.id).toBeDefined()
      expect(request.session.user).toMatchObject({
        id: user.id,
        email: user.email,
        needsWallet: !user.rapydWalletId,
        needsIDProof: !user.kycId
      })
      expect(response.statusCode).toBe(200)
      expect(response._getJSONData()).toMatchObject({
        success: true,
        message: 'Authorized'
      })
    })

    it('returns status 400 if the request body is not valid', async (): Promise<void> => {
      request.body = {
        ...args,
        email: 'not-an-email'
      }

      await authController.logIn(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })

      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(400)
      expect(response._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })

    it('returns status 500 on unexpected error', async (): Promise<void> => {
      request.body = {
        ...args
      }

      const authorizeSpy = jest
        .spyOn(authService, 'authorize')
        .mockRejectedValueOnce(new Error('Unexpected error'))
      await authController.logIn(request, response, (err) => {
        nextFunction()
        errorHandler(err, request, response, nextFunction)
      })

      expect(authorizeSpy).toHaveBeenCalledTimes(1)
      expect(nextFunction).toHaveBeenCalledTimes(1)
      expect(response.statusCode).toBe(500)
      expect(response._getJSONData()).toMatchObject({
        success: false,
        message: 'Internal Server Error'
      })
    })
  })
})
