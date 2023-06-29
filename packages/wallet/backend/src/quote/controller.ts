import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { Quote } from '../rafiki/generated/graphql'
import { QuoteService } from './service'
import { quoteSchema } from './validation'

interface IQuoteController {
  create: ControllerFunction<Quote>
}
interface QuoteControllerDependencies {
  quoteService: QuoteService
}

export class QuoteController implements IQuoteController {
  constructor(private deps: QuoteControllerDependencies) {}

  create = async (
    req: Request,
    res: CustomResponse<Quote>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { receiver, paymentPointerId, amount, isReceive, description }
      } = await validate(quoteSchema, req)

      const quote = await this.deps.quoteService.create({
        userId,
        paymentPointerId,
        amount,
        isReceive,
        receiver,
        description
      })
      res.status(200).json({ success: true, message: 'SUCCESS', data: quote })
    } catch (e) {
      next(e)
    }
  }
}
