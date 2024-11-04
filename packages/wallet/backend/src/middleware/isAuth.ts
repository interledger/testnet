import type { NextFunction, Request, Response } from 'express'
import { Unauthorized } from '@shared/backend'
import { User } from '@/user/model'

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

    if (!KYCRoutes.includes(req.url) && req.session.user.needsIDProof) {
      const user = await User.query().findById(req.session.user.id)
      if (user?.kycVerified) {
        req.session.user.needsIDProof = false
        req.session.user.customerId = user.customerId
        await req.session.save()
      } else {
        throw new Unauthorized('Unauthorized')
      }
    }
  } catch (e) {
    next(e)
  }

  next()
}
