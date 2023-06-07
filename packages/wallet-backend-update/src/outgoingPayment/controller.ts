import type { NextFunction, Request } from 'express'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import { outgoingPaymentSchema } from '@/outgoingPayment/validation'
import { OutgoingPaymentService } from '@/outgoingPayment/service'

interface IOutgoingPaymentController {
  create: ControllerFunction<Transaction>
}
interface OutgoingPaymentControllerDependencies {
  outgoingPaymentService: OutgoingPaymentService
}

export class OutgoingPaymentController implements IOutgoingPaymentController {
  constructor(private deps: OutgoingPaymentControllerDependencies) {}

  create = async (
    req: Request,
    res: CustomResponse<Transaction>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: {
          incomingPaymentUrl,
          toPaymentPointerUrl,
          paymentPointerId,
          amount,
          isReceive,
          description
        }
      } = await validate(outgoingPaymentSchema, req)
      console.log(req.body)
      const transaction = await this.deps.outgoingPaymentService.create(
        userId,
        paymentPointerId,
        amount,
        isReceive,
        incomingPaymentUrl,
        toPaymentPointerUrl,
        description
      )
      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: transaction })
    } catch (e) {
      next(e)
    }
  }
}
