import { NextFunction, Request, Response } from 'express'
import { WebHookService } from './webhook.service'

export class WebHookController {
  constructor(private webHookService: WebHookService) {}

  onWebHook(req: Request, res: Response, _next: NextFunction) {
    const wh = req.body
    res.status(201).json(this.webHookService.onWebHook(wh))
  }
}
