import type { NextFunction, Request } from 'express'
import type { UserService } from './service'
import type { User } from './model'
import { validate } from '@/shared/validate'
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@/user/validation'
import { Controller, toSuccessResponse, Unauthorized } from '@shared/backend'

interface UserFlags {
  needsWallet: boolean
  needsIDProof: boolean
}
interface TokenValidity {
  isValid: boolean
}

interface IUserController {
  me: Controller<UserFlags>
  requestResetPassword: Controller
  resetPassword: Controller
  checkToken: Controller<TokenValidity>
}

export class UserController implements IUserController {
  constructor(private userService: UserService) {}

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

      const user = await this.userService.getById(req.session.user.id)

      if (!user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      res.json(
        toSuccessResponse(
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            needsWallet: !user.rapydWalletId,
            needsIDProof: !user.kycId
          },
          'User retrieved successfully'
        )
      )
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

      await this.userService.requestResetPassword(email)

      res.json(
        toSuccessResponse(
          undefined,
          'An email with reset password steps was sent to provided email'
        )
      )
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

      await this.userService.resetPassword(token, password)

      res.json(
        toSuccessResponse(undefined, 'Password was updated successfully')
      )
    } catch (e) {
      next(e)
    }
  }

  changePassword = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    const { id: userId } = req.session.user

    try {
      const {
        body: { oldPassword, newPassword }
      } = await validate(changePasswordSchema, req)

      await this.userService.changePassword(oldPassword, newPassword, userId)

      res.json(
        toSuccessResponse(undefined, 'Password was changed successfully')
      )
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

      const isValid = await this.userService.validateToken(token)

      res.json(toSuccessResponse({ isValid }, 'Token was checked'))
    } catch (e) {
      next(e)
    }
  }
}
