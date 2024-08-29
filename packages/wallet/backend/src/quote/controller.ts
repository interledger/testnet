import { Amount, Quote } from '@/rafiki/backend/generated/graphql'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { QuoteService } from './service'
import { quoteSchema } from './validation'
import { Controller, toSuccessResponse } from '@shared/backend'
import { QuoteResponse } from '@wallet/shared'

interface IQuoteController {
  create: Controller<Quote>
}

export type QuoteWithFees = Quote & {
  fee?: Amount
}

export class QuoteController implements IQuoteController {
  constructor(private quoteService: QuoteService) {}

  create = async (
    req: Request,
    res: CustomResponse<QuoteResponse>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const {
        body: { receiver, walletAddressId, amount, isReceive, description }
      } = await validate(quoteSchema, req)

      const quote = await this.quoteService.create({
        userId,
        walletAddressId,
        amount,
        isReceive,
        receiver,
        description
      })
      res.status(200).json(toSuccessResponse(quote))
    } catch (e) {
      next(e)
    }
  }
}
