import { Cradle, createContainer } from '@/createContainer'
import { env, Env } from '@/config/env'
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
import { AwilixContainer } from 'awilix'
import { AdminNotificationController } from '@/admin-notification/controller'
import { AdminNotificationService } from '@/admin-notification/service'
import { EmailService } from '@/email/service'
import { UserService } from '@/user/service'
import { isAdminSecret } from '@/middleware/isAdminSecret'
import { applyMiddleware } from '@/tests/utils'
import { errorHandler } from '@/tests/helpers'
import { MAX_BODY_HTML_LENGTH } from '@/admin-notification/validation'

const ADMIN_SECRET = 'test-admin-secret'

const enabledEnv: Env = {
  ...env,
  ADMIN_NOTIFICATION_SECRET: ADMIN_SECRET
}

const disabledEnv: Env = {
  ...env,
  ADMIN_NOTIFICATION_SECRET: undefined
}

describe('Admin Notification Controller', () => {
  let bindings: AwilixContainer<Cradle>
  let appContainer: TestApp
  let knex: Knex
  let adminNotificationController!: AdminNotificationController
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  const next = jest.fn()

  const mockEmailService = {
    sendAnnouncementBatch: jest.fn()
  }

  const mockUserService = {
    getVerifiedUserEmails: jest.fn(),
    getByEmail: jest.fn()
  }

  beforeAll(async () => {
    bindings = await createContainer(enabledEnv)
    appContainer = await createApp(bindings)
    knex = appContainer.knex
    adminNotificationController = bindings.resolve(
      'adminNotificationController'
    )!
  })

  beforeEach(() => {
    jest.clearAllMocks()
    req = createRequest()
    res = createResponse()
    mockUserService.getByEmail.mockImplementation(async (email: string) => ({
      email
    }))
    Reflect.set(
      adminNotificationController,
      'adminNotificationService',
      new AdminNotificationService(
        mockEmailService as unknown as EmailService,
        mockUserService as unknown as UserService,
        { info: jest.fn(), error: jest.fn() } as never
      )
    )
  })

  afterEach(async () => {
    await truncateTables(knex)
  })

  afterAll(async () => {
    await appContainer.stop()
    await knex.destroy()
  })

  describe('when ADMIN_NOTIFICATION_SECRET is not set', () => {
    let disabledBindings: AwilixContainer<Cradle>
    let disabledApp: TestApp

    beforeAll(async () => {
      disabledBindings = await createContainer(disabledEnv)
      disabledApp = await createApp(disabledBindings)
    })

    afterAll(async () => {
      await disabledApp.stop()
      await disabledBindings.resolve('knex').destroy()
    })

    it('does not register admin notification controller', () => {
      expect(() =>
        disabledBindings.resolve('adminNotificationController')
      ).toThrow()
    })

    it('returns 404 for POST /admin/notifications/email', async () => {
      const response = await fetch(
        `http://127.0.0.1:${disabledApp.port}/admin/notifications/email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: 'Test',
            bodyHtml: '<p>Test</p>',
            sendToAll: true
          })
        }
      )

      expect(response.status).toBe(404)
    })
  })

  describe('isAdminSecret middleware', () => {
    const adminSecretMiddleware = isAdminSecret(enabledEnv)

    it('returns 401 when x-admin-secret header is missing', async () => {
      req = createRequest()

      await applyMiddleware(adminSecretMiddleware, req, res).catch((e) => {
        errorHandler(e, req, res, next)
      })

      expect(res.statusCode).toBe(401)
    })

    it('returns 401 when x-admin-secret header is wrong', async () => {
      req = createRequest({
        headers: { 'x-admin-secret': 'wrong-secret' }
      })

      await applyMiddleware(adminSecretMiddleware, req, res).catch((e) => {
        errorHandler(e, req, res, next)
      })

      expect(res.statusCode).toBe(401)
    })

    it('calls next when x-admin-secret header is valid', async () => {
      req = createRequest({
        headers: { 'x-admin-secret': ADMIN_SECRET }
      })
      const middlewareNext = jest.fn()

      adminSecretMiddleware(req, res, middlewareNext)

      expect(middlewareNext).toHaveBeenCalledWith()
    })
  })

  it('returns 400 when neither sendToAll nor recipients is provided', async () => {
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>'
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when both sendToAll and recipients are provided', async () => {
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      sendToAll: true,
      recipients: ['user@example.com']
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when recipients is an empty array', async () => {
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: []
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when sendToAll is true but no verified users exist', async () => {
    mockUserService.getVerifiedUserEmails.mockResolvedValue([])
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      sendToAll: true
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when recipients are not registered users', async () => {
    mockUserService.getByEmail.mockResolvedValue(undefined)
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['unknown@example.com']
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns 400 when bodyHtml exceeds maximum length', async () => {
    req.body = {
      subject: 'Test',
      bodyHtml: 'a'.repeat(MAX_BODY_HTML_LENGTH + 1),
      recipients: ['user@example.com']
    }

    await adminNotificationController.send(req, res, (e) => {
      errorHandler(e, req, res, next)
    })

    expect(res.statusCode).toBe(400)
  })

  it('returns failed recipients when all sends fail', async () => {
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 0,
      failed: 2,
      failedRecipients: ['user1@example.com', 'user2@example.com']
    })
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['user1@example.com', 'user2@example.com']
    }

    await adminNotificationController.send(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'SUCCESS',
      result: {
        sent: 0,
        failed: 2,
        total: 2,
        failedRecipients: ['user1@example.com', 'user2@example.com']
      }
    })
  })

  it('sends to explicit recipients', async () => {
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 2,
      failed: 0,
      failedRecipients: []
    })
    req.body = {
      subject: 'Test',
      bodyHtml: '<p>Test</p>',
      recipients: ['user1@example.com', 'user2@example.com']
    }

    await adminNotificationController.send(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(mockEmailService.sendAnnouncementBatch).toHaveBeenCalledWith(
      ['user1@example.com', 'user2@example.com'],
      'Test',
      '<p>Test</p>'
    )
    expect(res._getJSONData()).toEqual({
      success: true,
      message: 'SUCCESS',
      result: { sent: 2, failed: 0, total: 2, failedRecipients: [] }
    })
  })

  it('sends to all verified users when sendToAll is true', async () => {
    mockUserService.getVerifiedUserEmails.mockResolvedValue([
      'verified1@example.com',
      'verified2@example.com'
    ])
    mockEmailService.sendAnnouncementBatch.mockResolvedValue({
      sent: 2,
      failed: 0,
      failedRecipients: []
    })
    req.body = {
      subject: 'Broadcast',
      bodyHtml: '<p>Broadcast</p>',
      sendToAll: true
    }

    await adminNotificationController.send(req, res, next)

    expect(res.statusCode).toBe(200)
    expect(mockUserService.getVerifiedUserEmails).toHaveBeenCalled()
    expect(mockEmailService.sendAnnouncementBatch).toHaveBeenCalledWith(
      ['verified1@example.com', 'verified2@example.com'],
      'Broadcast',
      '<p>Broadcast</p>'
    )
  })
})
