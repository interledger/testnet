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
import { applyMiddleware, uuid } from '@/tests/utils'
import { withSession } from '@/middleware/withSession'
import type { UserController } from '@/user/controller'
import { mockLogInRequest } from '../mocks'
import { createUser, errorHandler } from '@/tests/helpers'
import { faker } from '@faker-js/faker'
import { getRandomToken, hashToken } from '@/utils/helpers'
import { User } from '@/user/model'
import { AwilixContainer } from 'awilix'

describe('User Controller', (): void => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let authService: AuthService
  let userController: UserController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let userInfo: { id: string; email: string }

  const next = jest.fn()
  const args = mockLogInRequest().body

  beforeAll(async (): Promise<void> => {
    bindings = await createContainer(env)
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
      needsWallet: !user.gateHubUserId,
      needsIDProof: !user.kycVerified,
      customerId: user.customerId
    }

    userInfo = {
      id: user.id,
      email: user.email
    }
  })

  afterAll(async (): Promise<void> => {
    await appContainer.stop()
    await knex.destroy()
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
        result: {
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

  describe('Request ResetPassword', () => {
    it('should return a message that a reset email has been sent', async () => {
      req.body = {
        email: userInfo.email
      }

      await userController.requestResetPassword(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'An email with reset password steps was sent to provided email'
      })
    })
  })

  describe('Reset password', () => {
    it('should return a message that password has been rested', async () => {
      const resetToken = getRandomToken()
      const passwordResetToken = hashToken(resetToken)
      const passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await User.query()
        .findById(userInfo.id)
        .patch({ passwordResetToken, passwordResetExpiresAt })

      const password = faker.internet.password()
      req.body = {
        password,
        confirmPassword: password
      }
      req.params = {
        token: resetToken
      }

      await userController.resetPassword(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Password was updated successfully'
      })
    })

    it('should return invalid token', async () => {
      const password = faker.internet.password()
      req.body = {
        password,
        confirmPassword: password
      }
      req.params = {
        token: 'resetToken'
      }
      await userController.resetPassword(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })
  })

  describe('Change password', () => {
    it('should return a message that password has been changed', async () => {
      const oldPassword = faker.internet.password()

      await User.query()
        .findById(userInfo.id)
        .patch({ newPassword: oldPassword })

      const newPassword = faker.internet.password()
      req.body = {
        oldPassword,
        newPassword,
        confirmNewPassword: newPassword
      }

      await userController.changePassword(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Password was changed successfully'
      })
    })

    it('should return error message of incorrect old password', async () => {
      const oldPassword = faker.internet.password()
      const newPassword = faker.internet.password()
      req.body = {
        oldPassword,
        newPassword,
        confirmNewPassword: newPassword
      }
      await userController.changePassword(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(next).toHaveBeenCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })
  })

  describe('Check Token', () => {
    it('should return a boolean that the token is valid', async () => {
      const resetToken = getRandomToken()
      const passwordResetToken = hashToken(resetToken)
      const passwordResetExpiresAt = new Date(Date.now() + 10 * 60 * 1000)
      await User.query()
        .findById(userInfo.id)
        .patch({ passwordResetToken, passwordResetExpiresAt })

      req.params = {
        token: resetToken
      }

      await userController.checkToken(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Token was checked',
        result: {
          isValid: true
        }
      })
    })

    it('should return a boolean that the token is not valid', async () => {
      req.params = {
        token: 'resetToken'
      }

      await userController.checkToken(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'Token was checked',
        result: {
          isValid: false
        }
      })
    })
  })
})
