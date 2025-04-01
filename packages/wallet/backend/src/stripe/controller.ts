import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { StripeService } from './service'
import { validate } from '@/shared/validate'
import { webhookBodySchema } from './validation'

interface IStripeController {
  onWebHook: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<void>
}

export class StripeController implements IStripeController {
  constructor(
    private logger: Logger,
    private stripeService: StripeService,
  ) {}



  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wh = await validate(webhookBodySchema, req)
      await this.stripeService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      this.logger.error(
        `Webhook response error for stripe: ${(e as Error).message}`,
        req.body
      )
      next(e)
    }
  }
}
