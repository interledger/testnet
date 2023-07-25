import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { Quote, RafikiService, RatesResponse } from './service'
import { validate } from '../shared/validate'
import { quoteSchmea, webhookSchema } from './validation'
import { BadRequest } from '../errors'

interface IRafikiController {
  createQuote: (
    req: Request,
    res: Response<Quote>,
    next: NextFunction
  ) => Promise<void>
  getRates: (
    req: Request,
    res: Response<RatesResponse>,
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
      const { body } = await validate(quoteSchmea, req)
      const result = await this.deps.rafikiService.createQuote(body)
      res.status(201).json(result)
    } catch (e) {
      next(e)
    }
  }

  getRates = async (
    req: Request,
    res: Response<RatesResponse>,
    next: NextFunction
  ) => {
    try {
      const { base } = req.query
      if (!base) {
        throw new BadRequest('Rates base was not provided')
      }
      res.status(200).json(this.deps.rafikiService.getRates(base as string))
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
