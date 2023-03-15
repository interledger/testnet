import { Request, Response, NextFunction } from 'express'
import { PricesService } from './prices.service'

export class PricesController {
  constructor(private pricesService: PricesService) {}

  getPrices(_req: Request, res: Response, _next: NextFunction) {
    res.status(200).json(this.pricesService.getPrices())
  }
}
