import { env } from '@/config/env'
import { Cradle, createContainer } from '@/createContainer'
import { Request, Response } from 'express'
import {
  MockRequest,
  MockResponse,
  createRequest,
  createResponse
} from 'node-mocks-http'
import {
  mockOutgoingPaymentFailureService,
  mockOutgoingPaymentRequest,
  mockOutgoingPaymentService
} from '../mocks'
import { OutgoingPaymentController } from '@/outgoingPayment/controller'
import { errorHandler } from '@/middleware/errorHandler'
import { AwilixContainer } from 'awilix'

describe('OutgoingPayment controller', () => {
  let bindings: AwilixContainer<Cradle>
  let req: MockRequest<Request>
  let res: MockResponse<Response>
  let outgoingPaymentController: OutgoingPaymentController

  const next = jest.fn()

  const createOutgoingPaymentControllerDepsMocked = (isFailure: boolean) => {
    const outgoingPaymentControllerDepsMocked = {
      outgoingPaymentService: isFailure
        ? mockOutgoingPaymentFailureService
        : mockOutgoingPaymentService
    }
    Reflect.set(
      outgoingPaymentController,
      'deps',
      outgoingPaymentControllerDepsMocked
    )
  }

  beforeAll(async () => {
    bindings = await createContainer(env)
    outgoingPaymentController = await bindings.resolve(
      'outgoingPaymentController'
    )
    createOutgoingPaymentControllerDepsMocked(false)
  })

  beforeEach(async (): Promise<void> => {
    req = createRequest()
    res = createResponse()
  })

  it('should call createByQuoteId in outgoingPaymentService.', async () => {
    req.body = mockOutgoingPaymentRequest().body
    const createByQuoteIdSpy = jest.spyOn(
      mockOutgoingPaymentService,
      'createByQuoteId'
    )

    await outgoingPaymentController.create(req, res, next)

    expect(createByQuoteIdSpy).toHaveBeenCalled()
    expect(createByQuoteIdSpy).toHaveBeenCalledTimes(1)
    expect(createByQuoteIdSpy).toHaveBeenCalledWith(req.body.quoteId)
  })

  it('should return status 400 if the request body is invalid', async () => {
    req.body = mockOutgoingPaymentRequest().body
    delete req.body.quoteId

    await outgoingPaymentController.create(req, res, (err) => {
      next()
      errorHandler(err, req, res, next)
    })

    expect(next).toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(400)
  })

  it('should return status 500 on unexpected error', async () => {
    createOutgoingPaymentControllerDepsMocked(true)
    req.body = mockOutgoingPaymentRequest().body

    await outgoingPaymentController.create(req, res, (err) => {
      next()
      errorHandler(err, req, res, next)
    })

    expect(next).toHaveBeenCalled()
    expect(next).toHaveBeenCalledTimes(1)
    expect(res.statusCode).toBe(500)
  })
})
