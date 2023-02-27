import { Request, Response, NextFunction } from 'express'
import { BaseError } from '../shared/models/errors/BaseError'
import logger from '../utils/logger'
const log = logger('GlobalErrorHandler')
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof BaseError) {
    res
      .status(err.statusCode)
      .json({ success: err.success, message: err.message, errors: err.errors })
    throw err
  } else {
    log.error(err)
    res.status(500).json({ error: 'Internal Server Error' })
  }
}
