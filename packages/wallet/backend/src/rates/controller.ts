import { validate } from '@/shared/validate'
import { NextFunction, Request } from 'express'
import { ratesSchema } from './validation'
import { RatesResponse, RatesService } from './service'

interface IRatesController {
  getRates: ControllerFunction<RatesResponse>
}
interface RatesServiceDependencies {
  ratesService: RatesService
}

export class RatesController implements IRatesController {
  constructor(private deps: RatesServiceDependencies) {}

  getRates = async (
    req: Request,
    res: CustomResponse<RatesResponse>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { base }
      } = await validate(ratesSchema, req)
      const rates = await this.deps.ratesService.getRates(base)

      res.status(200).json({
        success: true,
        message: 'SUCCESS',
        data: rates
      })
    } catch (e) {
      next(e)
    }
  }
}
