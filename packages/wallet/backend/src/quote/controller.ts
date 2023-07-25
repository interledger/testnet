import { Amount, Quote } from '@/rafiki/backend/generated/graphql'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { QuoteService } from './service'
import { quoteSchema } from './validation'

interface IQuoteController {
  create: ControllerFunction<Quote>
}
interface QuoteControllerDependencies {
  quoteService: QuoteService
}

export type ConversedQuote = Quote & {
  fee?: Amount
}

export class QuoteController implements IQuoteController {
  constructor(private deps: QuoteControllerDependencies) {}

  create = async (
    req: Request,
    res: CustomResponse<ConversedQuote | Quote>,
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
