import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'
import { Env } from '@/config/env'

export const isAdminSecret = (env: Env) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const secret = req.headers['x-admin-secret']
    if (
      typeof secret !== 'string' ||
      secret !== env.ADMIN_NOTIFICATION_SECRET
    ) {
      return next(new Unauthorized('Unauthorized'))
    }
    next()
  }
}
