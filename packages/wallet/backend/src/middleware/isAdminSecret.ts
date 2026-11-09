import type { NextFunction, Request, Response } from 'express'
import { timingSafeEqual } from 'crypto'
import { Unauthorized } from '@shared/backend'
import { Env } from '@/config/env'

export const isAdminSecret = (env: Env) => {
  const expected = env.ADMIN_NOTIFICATION_SECRET ?? ''
  const expectedBuf = Buffer.from(expected)

  return (req: Request, _res: Response, next: NextFunction): void => {
    const secret = req.headers['x-admin-secret']
    if (typeof secret !== 'string') {
      return next(new Unauthorized('Unauthorized'))
    }

    const providedBuf = Buffer.from(secret)
    // timingSafeEqual throws on length mismatch; reject those cases first.
    if (
      expectedBuf.length === 0 ||
      providedBuf.length !== expectedBuf.length ||
      !timingSafeEqual(providedBuf, expectedBuf)
    ) {
      return next(new Unauthorized('Unauthorized'))
    }

    next()
  }
}
