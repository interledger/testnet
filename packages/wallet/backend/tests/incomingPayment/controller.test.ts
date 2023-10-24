import { env } from '@/config/env'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { NextFunction, Request, Response } from 'express'
import { createContainer } from '@/createContainer'
import { IncomingPaymentController } from '@/incomingPayment/controller'
import {
  mockIncomingPaymentRequest,
  mockIncomingPaymentRequestSession as mockIncomingPaymentRequestSessionUser,
  mockIncomingPaymentService
} from '../mocks'
import { errorHandler } from '@/middleware/errorHandler'

describe('Incoming Payment Controller', () => {
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let incomingPaymentController: IncomingPaymentController

  const next = jest.fn() as unknown as NextFunction

  const createIncomingPaymentControllerDepsMock = () => {
    const incomingPaymentControllerDepsMock = {
      incomingPaymentService: mockIncomingPaymentService
    }
    Reflect.set(
      incomingPaymentController,
      'deps',
      incomingPaymentControllerDepsMock
    )
  }

  beforeAll(async () => {
    const container = createContainer(env)
    incomingPaymentController = await container.resolve(
      'incomingPaymentController'
    )
    createIncomingPaymentControllerDepsMock()
  })

  beforeEach(async (): Promise<void> => {
    const user = mockIncomingPaymentRequestSessionUser().user
    req = createRequest({ session: { user } })
    res = createResponse()
  })

  describe('Create', () => {
    it('should call method create() in incomingPaymentService', async () => {
      const createSpy = jest.spyOn(mockIncomingPaymentService, 'create')
      req.body = mockIncomingPaymentRequest().body
      await incomingPaymentController.create(req, res, next)
      expect(createSpy).toHaveBeenCalled()
      expect(createSpy).toHaveBeenCalledTimes(1)
      expect(createSpy).toHaveBeenCalledWith(
        req.session.user.id,
        req.body.paymentPointerId,
        req.body.amount,
        req.body.description,
        req.body.expiration
      )
    })
    it("should return status 200 and message 'SUCCESS' if the payment was created", async () => {
      req.body = mockIncomingPaymentRequest().body
      await incomingPaymentController.create(req, res, next)
      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        success: true,
        message: 'SUCCESS',
        data: { url: 'https://www.some-domain.com' }
      })
    })
    it("should return status 400 if the incomingPayment body is not valid", async () => { 
      req.body = mockIncomingPaymentRequest().body
      delete req.body.paymentPointerId
      await incomingPaymentController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(res.statusCode).toBe(400)
    })
    it("should not call method create() in incomingPaymentService if the incomingPayment body is not valid", async () => {
      const createSpy = jest.spyOn(mockIncomingPaymentService, 'create')
      req.body = mockIncomingPaymentRequest().body
      delete req.body.paymentPointerId
      await incomingPaymentController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(createSpy).not.toBeCalled()
    })
  })
})
