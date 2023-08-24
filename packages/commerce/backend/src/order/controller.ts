import { NextFunction, Request } from 'express'
import { IOrderService } from './service'
import { Order } from './model'
import { BadRequest } from '@/errors'
import { toSuccessReponse } from '@/shared/utils'
import { Logger } from 'winston'

interface GetParams {
  id?: string
}

export interface IOrderController {
  get: Controller<Order>
}

export class OrderController implements IOrderController {
  constructor(
    private orderService: IOrderService,
    private logger: Logger
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
}
