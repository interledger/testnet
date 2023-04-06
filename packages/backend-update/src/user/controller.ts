import { NotFound } from '@/errors'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import type { UserService } from './service'
import type { SessionService } from '@/session/service'

interface UserProfile {
  email: string
  lastName?: string
  firstName?: string
  address?: string
  country?: string
  needsWallet: boolean
  needsIDProof: boolean
}

interface IUserController {
  me: (
    req: Request,
    res: CustomResponse<UserProfile>,
    next: NextFunction
  ) => Promise<void>
}
interface UserControllerDependencies {
  userService: UserService
  sessionService: SessionService
  logger: Logger
}

export class UserController implements IUserController {
  constructor(private deps: UserControllerDependencies) {}

  me = async (
    req: Request,
    res: CustomResponse<UserProfile>,
    next: NextFunction
  ) => {
    try {
      const session = await this.deps.sessionService.getById(req.session.id)
      const user = await this.deps.userService.getById(req.session.user.id)

      if (!user || !session) {
        req.session.destroy()
        throw new NotFound('User not found')
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          email: user.email,
          address: user.address,
          country: user.country,
          firstName: user.firstName,
          lastName: user.lastName,
          needsWallet: !user.rapydWalletId,
          needsIDProof: !user.kycId
        }
      })
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }
}
