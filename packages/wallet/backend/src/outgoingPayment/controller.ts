import { OutgoingPaymentService } from '@/outgoingPayment/service'
import {
  acceptQuoteSchema,
  outgoingPaymentSchema
} from '@/outgoingPayment/validation'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import type { NextFunction, Request } from 'express'
import { Quote } from '../rafiki/generated/graphql'

interface IOutgoingPaymentController {
  create: ControllerFunction<Quote>
  acceptQuote: ControllerFunction<Transaction>
}
interface OutgoingPaymentControllerDependencies {
  outgoingPaymentService: OutgoingPaymentService
}

export class OutgoingPaymentController implements IOutgoingPaymentController {
  constructor(private deps: OutgoingPaymentControllerDependencies) {}

  create = async (
    req: Request,
    res: CustomResponse<Quote>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { receiver, paymentPointerId, amount, isReceive, description }
      } = await validate(outgoingPaymentSchema, req)

      const quote = await this.deps.outgoingPaymentService.create(
        userId,
        paymentPointerId,
        amount,
        isReceive,
        receiver,
        description
      )
      res.status(200).json({ success: true, message: 'SUCCESS', data: quote })
    } catch (e) {
      next(e)
    }
  }

  acceptQuote = async (
    req: Request,
    res: CustomResponse<Transaction>,
    next: NextFunction
  ) => {
    try {
      const {
        body: { quoteId }
      } = await validate(acceptQuoteSchema, req)

      const transaction = await this.deps.outgoingPaymentService.acceptQuote(
        quoteId
      )

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: transaction })
    } catch (e) {
      next(e)
    }
  }
}
