import { Request, Response, NextFunction } from 'express'
import { RatesService } from './rates.service'

export class RatesController {
  constructor(private ratesService: RatesService) {}

  getRates = (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json(this.ratesService.getRates())
  }
}
