import { NextFunction, Request } from 'express'
import { IOrderService } from './service'
import { Order } from './model'
import { BadRequest } from '@/errors'
import { toSuccessReponse } from '@/shared/utils'
import { Logger } from 'winston'
import { IOpenPayments } from '@/open-payments/service'
import { validate } from '@/middleware/validate'
import { createOrderSchema, finishOrderSchema } from './validation'

interface GetParams {
  id?: string
}

interface CreateResponse {
  redirectUrl: string
}

export interface IOrderController {
  get: Controller<Order>
  create: Controller<CreateResponse>
  finish: Controller
}

export class OrderController implements IOrderController {
  constructor(
    private logger: Logger,
    private openPayments: IOpenPayments,
    private orderService: IOrderService
  ) {}

  public async get(
    req: Request<GetParams>,
    res: TypedResponse<Order>,
    next: NextFunction
  ) {
    try {
      const { params } = req
      if (!params.id) {
        throw new BadRequest('Order ID was not provided.')
      }

      const order = await this.orderService.get(params.id)

      res.status(200).json(toSuccessReponse(order))
    } catch (err) {
      this.logger.error(err)
      next(err)
    }
  }

  public async create(
    req: Request,
    res: TypedResponse<CreateResponse>,
    next: NextFunction
  ) {
    try {
      const { products, paymentPointerUrl } = await validate(
        createOrderSchema,
        req.body
      )

      const order = await Order.transaction(async (trx) => {
        const newOrder = await this.orderService.create(
          { orderItems: products },
          trx
        )
        return await newOrder.calcaulateTotalAmount(trx)
      })

      const grant = await this.openPayments.preparePayment({
        order,
        paymentPointerUrl
      })

      this.logger.debug(JSON.stringify(grant, null, 2))
      res
        .status(201)
        .json(toSuccessReponse({ redirectUrl: grant.interact.redirect }))
    } catch (err) {
      next(err)
    }
  }

  public async finish(req: Request, res: TypedResponse, next: NextFunction) {
    try {
      const orderId = req.params.id
      if (!orderId) {
        throw new BadRequest('Order ID was not provided.')
      }

      // TODO: Verify hash
      // https://rafiki.dev/concepts/open-payments/grant-interaction/#endpoints
      const { interactRef, result } = await validate(
        finishOrderSchema,
        req.body
      )

      if (result) {
        const status = result === 'grant_reject' ? 200 : 400
        const message =
          result === 'grant_reject' ? 'Reject message' : 'Invalid message'
        this.orderService.reject(orderId)
        res
          .status(status)
          .json({ success: status === 200 ? true : false, message })
      }

      const order = await this.orderService.get(orderId)
      res.status(200).json({ success: true, message: 'SUCCESS' })
      await this.openPayments.createOutgoingPayment(order, interactRef)
    } catch (err) {
      next(err)
    }
  }
}
