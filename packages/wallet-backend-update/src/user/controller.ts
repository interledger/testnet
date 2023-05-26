import { Unauthorized } from '@/errors'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import type { UserService } from './service'
import type { SessionService } from '@/session/service'

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
    res: CustomResponse<UserFlags>,
    next: NextFunction
  ) => {
    try {
      const user = await this.deps.userService.getById(req.session.user.id)

      if (!user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      res.json({
        success: true,
        message: 'User retrieved successfully',
        data: {
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
