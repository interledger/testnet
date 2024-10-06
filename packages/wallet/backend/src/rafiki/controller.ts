import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { RatesService } from '@/rates/service'
import { ratesSchema } from '@/rates/validation'
import { validate } from '@/shared/validate'
import { RafikiService } from './service'
import { webhookSchema } from './validation'
import { RatesResponse } from '@wallet/shared'
interface IRafikiController {
  getRates: (
    req: Request,
    res: Response<RatesResponse>,
    next: NextFunction
  ) => Promise<void>
}

export class RafikiController implements IRafikiController {
  constructor(
    private logger: Logger,
    private rafikiService: RafikiService,
    private ratesService: RatesService
  ) {}

  getRates = async (
    req: Request,
    res: Response<RatesResponse>,
    next: NextFunction
  ) => {
    try {
      const {
        query: { base }
      } = await validate(ratesSchema, req)
      const rates = await this.ratesService.getRates(base)
      res.status(200).json(rates)
    } catch (e) {
      next(e)
    }
  }

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req.header)
      console.log(req.headers)
      const wh = await validate(webhookSchema, req)

      await this.rafikiService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.logger.error(
        `Webhook response error for rafiki: ${(e as Error).message}`,
        req.body
      )
      next(e)
    }
  }
}
