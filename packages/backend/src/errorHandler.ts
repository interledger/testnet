import { Request, Response, NextFunction } from 'express'
import logger from './logger'
const log = logger('GlobalErrorHandler')
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  log.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
}
