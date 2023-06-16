import { OutgoingPaymentService } from '@/outgoingPayment/outgoing-payment-service'
import {
  acceptQuoteSchema,
  outgoingPaymentSchema
} from '@/outgoingPayment/validation'
import { validate } from '@/shared/validate'
import { Transaction } from '@/transaction/model'
import type { NextFunction, Request } from 'express'
import { Quote } from '../rafiki/generated/graphql'
import { QuoteService } from './quote-service'

interface IOutgoingPaymentController {
  createQuote: ControllerFunction<Quote>
  createOutgoingPayment: ControllerFunction<Transaction>
}
interface OutgoingPaymentControllerDependencies {
  outgoingPaymentService: OutgoingPaymentService
  quoteService: QuoteService
}

export class OutgoingPaymentController implements IOutgoingPaymentController {
  constructor(private deps: OutgoingPaymentControllerDependencies) {}

  createQuote = async (
    req: Request,
    res: CustomResponse<Quote>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { receiver, paymentPointerId, amount, isReceive, description }
      } = await validate(outgoingPaymentSchema, req)

      const quote = await this.deps.quoteService.create(
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

  createOutgoingPayment = async (
    req: Request,
    res: CustomResponse<Transaction>,
    next: NextFunction
  ) => {
    try {
      const {
        body: { quoteId }
      } = await validate(acceptQuoteSchema, req)

      const transaction = await this.deps.outgoingPaymentService.create(quoteId)

      res
        .status(200)
        .json({ success: true, message: 'SUCCESS', data: transaction })
    } catch (e) {
      next(e)
    }
  }
}
