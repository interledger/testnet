import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { outgoingPaymentSchema } from '@/outgoingPayment/validation'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { Controller, toSuccessResponse } from '@shared/backend'

interface IOutgoingPaymentController {
  create: Controller
}

export class OutgoingPaymentController implements IOutgoingPaymentController {
  constructor(private outgoingPaymentService: OutgoingPaymentService) {}

  create = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { quoteId }
      } = await validate(outgoingPaymentSchema, req)

      await this.outgoingPaymentService.createByQuoteId(quoteId)

      res.status(200).json(toSuccessResponse())
    } catch (e) {
      next(e)
    }
  }
}
