import { Unauthorized } from '@/errors'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import type { UserService } from './service'
import type { SessionService } from '@/session/service'
import type { User } from './model'

interface UserFlags {
  needsWallet: boolean
  needsIDProof: boolean
}

interface IUserController {
  me: ControllerFunction<UserFlags>
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
    res: CustomResponse<
      Pick<User, 'email' | 'firstName' | 'lastName' | 'address'> & UserFlags
    >,
    next: NextFunction
  ) => {
    try {
      if (!req.session.id || !req.session.user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      const user = await this.deps.userService.getById(req.session.user.id)

      if (!user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          address: user.address,
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
