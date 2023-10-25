import { Unauthorized } from '@/errors'
import type { SessionService } from '@/session/service'
import { validate } from '@/shared/validate'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@/user/validation'
import type { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import type { User } from './model'
import type { UserService } from './service'

interface UserFlags {
  needsWallet: boolean
  needsIDProof: boolean
}

interface TokenValidity {
  isValid: boolean
}

interface IUserController {
  me: ControllerFunction<UserFlags>
  requestResetPassword: ControllerFunction
  resetPassword: ControllerFunction
  changePassword: ControllerFunction
  checkToken: ControllerFunction<TokenValidity>
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
      next(e)
    }
  }

  changePassword = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { email, oldPassword, password }
      } = await validate(changePasswordSchema, req)

      await this.deps.userService.changePassword({
        email,
        newPassword: password,
        oldPassword
      })

      res.json({
        success: true,
        message: 'Password has been updated successfully'
      })
    } catch (e) {
      next(e)
    }
  }

  requestResetPassword = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { email }
      } = await validate(forgotPasswordSchema, req)

      await this.deps.userService.requestResetPassword(email)

      res.json({
        success: true,
        message: 'An email with reset password steps was sent to provided email'
      })
    } catch (e) {
      next(e)
    }
  }

  resetPassword = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { password },
        params: { token }
      } = await validate(resetPasswordSchema, req)

      await this.deps.userService.resetPassword(token, password)

      res.json({
        success: true,
        message: 'Password was updated successfully'
      })
    } catch (e) {
      next(e)
    }
  }

  checkToken = async (
    req: Request,
    res: CustomResponse<TokenValidity>,
    next: NextFunction
  ) => {
    try {
      const token = req.params.token

      const isValid = await this.deps.userService.validateToken(token)

      res.json({
        success: true,
        message: 'Token was checked',
        data: { isValid }
      })
    } catch (e) {
      next(e)
    }
  }
}
