import { User } from '@/user/model'
import { initErrorHandler, initLogger } from '@shared/backend'
import type { NextFunction, Request } from 'express'
import { TypedResponse } from '@shared/backend/src'

export const createUser = (args: Partial<User>) => {
  return User.query().insertAndFetch(args)
}

export const errorHandler: (
  e: Error,
  req: Request,
  res: TypedResponse,
  next: NextFunction
) => void = initErrorHandler(initLogger('test'))
