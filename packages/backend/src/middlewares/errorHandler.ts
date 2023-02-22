import { Request, Response, NextFunction } from 'express'
import { BaseError } from '../errors/baseError'
import logger from '../utils/logger'
const log = logger('GlobalErrorHandler')
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof BaseError) {
    const { statusCode, message } = err
    res.status(statusCode).json({ error: message })
  } else {
    log.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
