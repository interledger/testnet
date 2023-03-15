import { Request, Response, NextFunction } from 'express'
import { QuoteService } from './quote.service'

export class QuoteController {
  constructor(private quoteService: QuoteService) {}

  createQuote(req: Request, res: Response, _next: NextFunction) {
    const receivedQuote = req.body
    res.status(201).json(this.quoteService.createQuote(receivedQuote))
  }
}
