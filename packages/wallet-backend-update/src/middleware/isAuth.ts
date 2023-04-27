import { Unauthorized } from '@/errors'
import type { NextFunction, Request, Response } from 'express'
import { getIronSession } from 'iron-session'
import { SESSION_OPTIONS } from './withSession'

export const isAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const session = await getIronSession(req, res, SESSION_OPTIONS)
  try {
    if (!session.id || !session.user) {
      req.session.destroy()
      throw new Unauthorized('Unauthorized')
    }

    if (
      req.url !== '/wallet' &&
      (session.user.needsWallet || session.user.needsIDProof)
    ) {
      throw new Unauthorized('Unauthorized')
    }
  } catch (e) {
    next(e)
  }

  next()
}
