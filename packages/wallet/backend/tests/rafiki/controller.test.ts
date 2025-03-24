import { env } from '@/config/env'
import { Cradle, createContainer } from '@/createContainer'
import { RafikiController } from '@/rafiki/controller'
import { NextFunction, Request, Response } from 'express'
import {
  MockRequest,
  MockResponse,
  createRequest,
  createResponse
} from 'node-mocks-http'
import { Logger } from 'winston'
import {
  mockGetRatesRequest,
  mockOnWebhookRequest,
  mockOutgoingPaymentCompletedEvent,
  mockOutgoingPaymentCreatedEvent,
  mockOutgoingPaymentFailedEvent,
  mockRafikiService,
  mockRatesService
} from '../mocks'
import { AwilixContainer } from 'awilix'
import { errorHandler } from '@/tests/helpers'
import { EventType } from '@/rafiki/service'

describe('Rafiki controller', () => {
  let bindings: AwilixContainer<Cradle>
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let rafikiController: RafikiController
  let logger: Logger

  const next = jest.fn() as unknown as NextFunction

  const createRafikiControllerDepsMocked = () => {
    const rafikiControllerDepsMocked = {
      rafikiService: mockRafikiService,
      logger,
      ratesService: mockRatesService
    }

    for (const key in rafikiControllerDepsMocked)
      Reflect.set(
        rafikiController,
        key,
        rafikiControllerDepsMocked[
          key as keyof typeof rafikiControllerDepsMocked
        ]
      )
  }

  beforeAll(async () => {
    bindings = await createContainer(env)
    rafikiController = await bindings.resolve('rafikiController')
    logger = await bindings.resolve('logger')

    createRafikiControllerDepsMocked()
  })

  describe('Get Rates', () => {
    beforeEach(async (): Promise<void> => {
      req = createRequest()
      res = createResponse()
    })

    it('should call method getRates() in ratesService', async () => {
      const ratesSpy = jest.spyOn(mockRatesService, 'getRates')
      req.query = mockGetRatesRequest({ base: 'USD' }).query

      await rafikiController.getRates(req, res, next)

      expect(ratesSpy).toHaveBeenCalled()
      expect(ratesSpy).toHaveBeenCalledTimes(1)
      expect(ratesSpy).toHaveBeenCalledWith('USD')
    })

    it('should return rates with base USD', async () => {
      req.query = mockGetRatesRequest({ base: 'USD' }).query

      await rafikiController.getRates(req, res, next)

      expect(res.statusCode).toBe(200)
      expect(res._getJSONData()).toMatchObject({
        base: 'USD',
        rates: {}
      })
    })

    it('should not call method getRates in RatesService if the request body is not valid', async () => {
      req.query = mockGetRatesRequest().query
      delete req.query.base
      const ratesSpy = jest.spyOn(mockRatesService, 'getRates')

      await rafikiController.getRates(req, res, next)

      expect(ratesSpy).not.toBeCalled()
    })

    it('should return status 400 if the request body is not valid', async () => {
      req.query = mockGetRatesRequest().query
      delete req.query.base

      await rafikiController.getRates(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
      expect(res._getJSONData()).toMatchObject({
        success: false,
        message: 'Invalid input'
      })
    })
  })

  describe('On Webhook', () => {
    beforeEach(async (): Promise<void> => {
      req = createRequest()
      res = createResponse()
    })

    it('should call onWebHook in rafikiService.', async () => {
      req.body = mockOnWebhookRequest().body
      const onWebHookSpy = jest.spyOn(mockRafikiService, 'onWebHook')

      await rafikiController.onWebHook(req, res, next)

      expect(onWebHookSpy).toHaveBeenCalled()
      expect(onWebHookSpy).toHaveBeenCalledTimes(1)
      expect(onWebHookSpy).toHaveBeenCalledWith(req.body)
    })

    it('should call onWebHoohk and return status 200', async () => {
      req.body = mockOnWebhookRequest().body
      const resSpy = jest.spyOn(res, 'send')

      await rafikiController.onWebHook(req, res, next)

      expect(res.statusCode).toBe(200)
      expect(resSpy).toBeCalled()
      expect(resSpy).toBeCalledTimes(1)
    })

    it('should return status 400 if the request body is not valid', async () => {
      req.body = mockOnWebhookRequest().body
      delete req.body.type

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })

    it('should not call onWebHook in rafikiService if the request body is not valid', async () => {
      req.body = mockOnWebhookRequest().body
      delete req.body.type
      const onWebHookSpy = jest.spyOn(mockRafikiService, 'onWebHook')

      await rafikiController.onWebHook(req, res, next)

      expect(onWebHookSpy).not.toBeCalled()
    })

    it('should call logger error if the request body is not valid', async () => {
      req.body = mockOnWebhookRequest().body
      delete req.body.type
      const loggerSpy = jest.spyOn(logger, 'error')

      await rafikiController.onWebHook(req, res, next)

      expect(loggerSpy).toBeCalled()
      expect(loggerSpy).toBeCalledTimes(1)
    })

    it('call outgoing payment should fail because invalid input', async () => {
      req.body = mockOutgoingPaymentCreatedEvent({
        data: { debitAmount: {} }
      })

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })

    it('call outgoing payment should fail because because invalid input', async () => {
      req.body = mockOutgoingPaymentCreatedEvent({
        data: { debitAmount: { value: '' } }
      })

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })

    it('call outgoing payment completed should fail because invalid input', async () => {
      req.body = mockOutgoingPaymentCompletedEvent({ data: {} })

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })

    it('call outgoing payment failed should fail because invalid data', async () => {
      req.body = mockOutgoingPaymentFailedEvent({
        data: { debitAmount: {} }
      })

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })

    it('should throw an error unknow event type mock-event', async () => {
      req.body = mockOutgoingPaymentCreatedEvent({
        type: 'mock-event' as EventType
      })

      await rafikiController.onWebHook(req, res, (err) => {
        next()
        errorHandler(err, req, res, next)
      })

      expect(next).toBeCalled()
      expect(next).toBeCalledTimes(1)
      expect(res.statusCode).toBe(400)
    })
  })
})
