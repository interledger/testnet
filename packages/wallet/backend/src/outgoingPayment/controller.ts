import { OutgoingPaymentService } from '@/outgoingPayment/service'
import { outgoingPaymentSchema } from '@/outgoingPayment/validation'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'

interface IOutgoingPaymentController {
  create: ControllerFunction
}
interface OutgoingPaymentControllerDependencies {
  outgoingPaymentService: OutgoingPaymentService
}

export class OutgoingPaymentController implements IOutgoingPaymentController {
  constructor(private deps: OutgoingPaymentControllerDependencies) {}

  create = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { quoteId }
      } = await validate(outgoingPaymentSchema, req)
      await this.deps.outgoingPaymentService.createByQuoteId(quoteId)
      res.status(200).json({ success: true, message: 'SUCCESS' })
    } catch (e) {
      next(e)
    }
  }
}
