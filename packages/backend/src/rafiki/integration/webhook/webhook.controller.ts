import { NextFunction, Request, Response } from 'express'
import { WebHookService } from './webhook.service'

export class WebHookController {
  constructor(private webHookService: WebHookService) {}

  onWebHook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const wh = req.body
      await this.webHookService.onWebHook(wh)
      res.status(200).send()
    } catch (e) {
      next(e)
    }
  }
}
