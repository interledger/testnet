import { Controller, toSuccessResponse } from '@shared/backend'
import { NextFunction, Request } from 'express'
import {
  AdminNotificationService,
  SendNotificationResult
} from '@/admin-notification/service'
import { sendNotificationBodySchema } from '@/admin-notification/validation'
import { validate } from '@/shared/validate'

interface IAdminNotificationController {
  send: Controller<SendNotificationResult>
}

export class AdminNotificationController
  implements IAdminNotificationController
{
  constructor(private adminNotificationService: AdminNotificationService) {}

  public send = async (
    req: Request,
    res: CustomResponse<SendNotificationResult>,
    next: NextFunction
  ) => {
    try {
      const input = await validate(sendNotificationBodySchema, req)
      const result = await this.adminNotificationService.sendNotification(
        input.body
      )

      res.status(200).json(toSuccessResponse(result))
    } catch (e) {
      next(e)
    }
  }
}
