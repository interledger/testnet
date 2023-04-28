import { logger } from '@/config/logger'
import { BaseError } from '@/errors/Base'
import type { Request, NextFunction } from 'express'

export const errorHandler = (
  e: Error,
  _req: Request,
  res: CustomResponse,
  _next: NextFunction
) => {
  if (e instanceof BaseError) {
    res.status(e.statusCode).json({
      success: e.success,
      message: e.message,
      errors: e.errors
    })
  } else {
    logger.error(e)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
