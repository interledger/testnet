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

export class UserController implements IUserController {
  constructor(
    private userService: UserService,
    private sessionSerice: SessionService,
    private logger: Logger
  ) {}

  me = async (
    req: Request,
    res: CustomResponse<UserProfile>,
    next: NextFunction
  ) => {
    try {
      const session = await this.sessionSerice.getById(req.session.id)
      const user = await this.userService.getById(req.session.user.id)

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
      this.logger.error(e)
      next(e)
    }
  }
}
