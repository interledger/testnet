import type { NextFunction, Request, Response } from 'express'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS } from './withSession'

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await getIronSession(req, res, SESSION_OPTIONS)

  const user = session.user

  if (!user) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  return next()
}
