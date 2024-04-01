import { BaseError } from '@/errors/Base'
import type { Request, NextFunction } from 'express'
import { AxiosError } from 'axios'
import { generateLogger } from '@/config/logger'
import { env } from '@/config/env'

export const errorHandler = (
  e: Error,
  _req: Request,
  res: CustomResponse,
  _next: NextFunction
) => {
  const logger = generateLogger(env)
  if (e instanceof BaseError) {
    res.status(e.statusCode).json({
      success: e.success,
      message: e.message,
      errors: e.errors
    })
  } else if (e instanceof AxiosError) {
    logger.debug(JSON.stringify(e.response?.data, undefined, 2))

    const message =
      typeof e.response?.data.status === 'object'
        ? e.response?.data.status.message
        : e.response?.data.message
    logger.error(message, e.response?.data)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  } else {
    logger.error(e)
    res.status(500).json({ success: false, message: 'Internal Server Error' })
  }
}
