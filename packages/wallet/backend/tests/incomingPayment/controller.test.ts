import { env } from '@/config/env'
import {
  createRequest,
  createResponse,
  MockRequest,
  MockResponse
} from 'node-mocks-http'
import { NextFunction, Request, Response } from 'express'
import { Cradle, createContainer } from '@/createContainer'
import { IncomingPaymentController } from '@/incomingPayment/controller'
import {
  mockIncomingPaymentGetPaymentDetailsByUrlRequest,
  mockIncomingPaymentRequest,
  mockIncomingPaymentRequestSession as mockIncomingPaymentRequestSessionUser,
  mockIncomingPaymentService
} from '../mocks'
import { errorHandler } from '@/middleware/errorHandler'
import { AwilixContainer } from 'awilix'

describe('Incoming Payment Controller', () => {
  let bindings: AwilixContainer<Cradle>
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
    bindings = await createContainer(env)
    incomingPaymentController = await bindings.resolve(
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
    it('should return status 400 if the incomingPayment body is not valid', async () => {
      req.body = mockIncomingPaymentRequest().body
      delete req.body.paymentPointerId
      await incomingPaymentController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(res.statusCode).toBe(400)
    })
    it('should not call method create() in incomingPaymentService if the incomingPayment body is not valid', async () => {
      const createSpy = jest.spyOn(mockIncomingPaymentService, 'create')
      req.body = mockIncomingPaymentRequest().body
      delete req.body.paymentPointerId
      await incomingPaymentController.create(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })
      expect(createSpy).not.toBeCalled()
    })

    describe('Get Payment Details By Url', () => {
      it('should call method getPaymentDetailsByUrl() in incomingPaymentService', async () => {
        const getPaymentDetailsByUrlSpy = jest.spyOn(
          mockIncomingPaymentService,
          'getPaymentDetailsByUrl'
        )
        req.query = mockIncomingPaymentGetPaymentDetailsByUrlRequest().query
        await incomingPaymentController.getPaymentDetailsByUrl(req, res, next)
        expect(getPaymentDetailsByUrlSpy).toHaveBeenCalled()
        expect(getPaymentDetailsByUrlSpy).toHaveBeenCalledTimes(1)
        expect(getPaymentDetailsByUrlSpy).toHaveBeenCalledWith(req.query.url)
      })
      it("should return status 200 and message 'SUCCESS' if the payment details were fetched", async () => {
        req.query = mockIncomingPaymentGetPaymentDetailsByUrlRequest().query
        await incomingPaymentController.getPaymentDetailsByUrl(req, res, next)
        expect(res.statusCode).toBe(200)
        expect(res._getJSONData()).toMatchObject({
          success: true,
          message: 'SUCCESS'
        })
      })
      it('should return status 400 if the incomingPayment body is not valid', async () => {
        req.query = mockIncomingPaymentGetPaymentDetailsByUrlRequest({
          url: 'some-url'
        }).query
        await incomingPaymentController.getPaymentDetailsByUrl(
          req,
          res,
          (err) => {
            next()
            errorHandler(err, req, res, next)
          }
        )
        expect(res.statusCode).toBe(400)
        expect(res._getJSONData()).toMatchObject({
          success: false,
          message: 'Invalid input'
        })
      })
      it('should not call method getPaymentDetailsByUrl() in incomingPaymentService if the incomingPayment body is not valid', async () => {
        const getPaymentDetailsByUrlSpy = jest.spyOn(
          mockIncomingPaymentService,
          'getPaymentDetailsByUrl'
        )
        req.query = mockIncomingPaymentGetPaymentDetailsByUrlRequest({
          url: 'some-url'
        }).query
        await incomingPaymentController.getPaymentDetailsByUrl(
          req,
          res,
          (err) => {
            next()
            errorHandler(err, req, res, next)
          }
        )
        expect(getPaymentDetailsByUrlSpy).not.toBeCalled()
      })
    })
  })
})
