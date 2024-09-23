import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'

const KYCRoutes = ['/iframe-urls/onboarding', '/gatehub/add-user-to-gateway']

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
