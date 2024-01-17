import { Amount, Quote } from '@/rafiki/backend/generated/graphql'
import { validate } from '@/shared/validate'
import type { NextFunction, Request } from 'express'
import { QuoteService } from './service'
import { quoteSchema } from './validation'
import { createExchangeQuoteSchema } from '@/account/validation'

interface IQuoteController {
  create: ControllerFunction<Quote>
}

export type QuoteWithFees = Quote & {
  fee?: Amount
}

export class QuoteController implements IQuoteController {
  constructor(private quoteService: QuoteService) {}

  create = async (
    req: Request,
    res: CustomResponse<QuoteWithFees | Quote>,
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
      res.status(200).json({ success: true, message: 'SUCCESS', result: quote })
    } catch (e) {
      next(e)
    }
  }

  createExchangeQuote = async (
    req: Request,
    res: CustomResponse<QuoteWithFees | Quote>,
    next: NextFunction
  ) => {
    try {
      const userId = req.session.user.id
      const { accountId } = req.params
      const {
        body: { assetCode, amount }
      } = await validate(createExchangeQuoteSchema, req)

      const quote = await this.quoteService.createExchangeQuote({
        userId,
        accountId,
        assetCode,
        amount
      })

      res.status(200).json({ success: true, message: 'SUCCESS', result: quote })
    } catch (e) {
      next(e)
    }
  }
}
