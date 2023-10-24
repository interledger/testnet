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
      console.log('before validate', req.body);
      const {
        body: { quoteId }
      } = await validate(outgoingPaymentSchema, req)
      console.log('quoteId 1', quoteId);
      await this.deps.outgoingPaymentService.createByQuoteId(quoteId)
      console.log('quoteId 2', quoteId);
      res.status(200).json({ success: true, message: 'SUCCESS' })
      console.log('quoteId 3', quoteId);
    } catch (e) {
      console.log('quoteId failed', e);
      next(e)
    }
  }
}
