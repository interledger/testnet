import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { RhyzaService } from './service'
import { validate } from '@/shared/validate'
import { webhookBodySchema } from './validation'

export class RhyzaController {
  constructor(
    private logger: Logger,
    private rhyzaService: RhyzaService
  ) {}

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wh = await validate(webhookBodySchema, req)

      await this.rhyzaService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.logger.error(
        `Webhook response error for rhyza: ${(e as Error).message}`,
        req.body
      )
      next(e)
    }
  }
}
