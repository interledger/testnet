import { NextFunction, Request, Response } from 'express'
import { Logger } from 'winston'
import { Quote, RafikiService, Rates } from './service'

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
      const receivedQuote = req.body
      const result = await this.deps.rafikiService.createQuote(receivedQuote)
      res.status(201).json(result)
    } catch (e) {
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
      const wh = req.body
      await this.deps.rafikiService.onWebHook(wh)
      res.status(200).send()
    } catch (e) {
      next(e)
    }
  }
}
