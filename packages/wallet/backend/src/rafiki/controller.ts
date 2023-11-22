import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { RatesResponse, RatesService } from '@/rates/service'
import { validate } from '@/shared/validate'
import { RafikiService } from './service'
import { ratesSchema, webhookSchema } from './validation'

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
      const wh = await validate(webhookSchema, req)

      await this.rafikiService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.logger.error(
        `Webhook response error for rafiki: ${(e as Error).message}`
      )
      next(e)
    }
  }
}
