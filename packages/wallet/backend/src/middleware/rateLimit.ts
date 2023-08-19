import { env } from '@/config/env'
import rateLimit from 'express-rate-limit'
import { NextFunction, Request, Response } from 'express'

export const setRateLimit = (
  requests: number,
  intervalSeconds: number,
  skipFailedRequests: boolean = false
) => {
  if (env.NODE_ENV !== 'production') {
    return (_req: Request, _res: Response, next: NextFunction) => {
      next()
    }
  }

  return rateLimit({
    windowMs: intervalSeconds * 1000,
    max: requests,
    skipFailedRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: 'Too many requests, please try again later.',
      success: false
    }
  })
}
