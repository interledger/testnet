import { NextFunction, Request, Response } from 'express'
import { WebHookService } from './webhook.service'
import { BaseResponse } from '../../../shared/models/BaseResponse'

export class WebHookController {
  constructor(private webHookService: WebHookService) {}

  onWebHook = async (
    req: Request,
    res: Response<BaseResponse>,
    next: NextFunction
  ) => {
    try {
      const wh = req.body
      res.status(200).json({ success: await this.webHookService.onWebHook(wh) })
    } catch (e) {
      next(e)
    }
  }
}
