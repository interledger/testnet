import { Unauthorized } from '@/errors'
import type { NextFunction, Request, Response } from 'express'

const KYCRoutes = ['/wallet', '/verify', '/countries', '/documents']

export const isAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.session.id || !req.session.user) {
      req.session.destroy()
      throw new Unauthorized('Unauthorized')
    }

    if (
      !KYCRoutes.includes(req.url) &&
      (req.session.user.needsWallet || req.session.user.needsIDProof)
    ) {
      throw new Unauthorized('Unauthorized')
    }
  } catch (e) {
    next(e)
  }

  next()
}
