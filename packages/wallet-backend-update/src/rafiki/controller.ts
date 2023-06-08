import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { Quote, RafikiService, Rates } from './service'
import { validate } from '../shared/validate'
import { quoteSchmea, webhookSchema } from './validation'

interface IRafikiController {
  createQuote: (
    req: Request,
    res: Response<Quote>,
    next: NextFunction
  ) => Promise<void>
  getRates: (
    req: Request,
    res: Response<Rates>,
    next: NextFunction
  ) => Promise<void>
}
interface RafikiControllerDependencies {
  logger: Logger
  rafikiService: RafikiService
}

export class RafikiController implements IRafikiController {
  constructor(private deps: RafikiControllerDependencies) {}
  createQuote = async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(req)
      console.log(req.body)
      const { body } = await validate(quoteSchmea, req)
      const result = await this.deps.rafikiService.createQuote(body)
      res.status(201).json(result)
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }

  getRates = async (
    _req: Request,
    res: Response<Rates>,
    next: NextFunction
  ) => {
    try {
      res.status(200).json(this.deps.rafikiService.getRates())
    } catch (e) {
      next(e)
    }
  }

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wh = await validate(webhookSchema, req)

      await this.deps.rafikiService.onWebHook(wh.body)
      res.status(200).send()
    } catch (e) {
      next(e)
    }
  }
}
