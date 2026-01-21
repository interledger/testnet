import type { NextFunction, Request } from 'express'
import type { UserService } from './service'
import { validate } from '@/shared/validate'
import {
  changeCardsVisibilitySchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@/user/validation'
import { Controller, toSuccessResponse, Unauthorized } from '@shared/backend'
import { UserResponse } from '@wallet/shared'
import { ValidTokenResponse } from '@wallet/shared/src'

interface IUserController {
  me: Controller<UserResponse>
  requestResetPassword: Controller
  resetPassword: Controller
  checkToken: Controller<ValidTokenResponse>
  changeCardsVisibility: Controller
}

export class UserController implements IUserController {
  constructor(private userService: UserService) {}

  me = async (
    req: Request,
    res: CustomResponse<UserResponse>,
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

      if (req.session.user.needsIDProof && user.kycVerified) {
        req.session.user.needsIDProof = false
        req.session.user.customerId = user.customerId
        await req.session.save()
      }

      res.json(
        toSuccessResponse(
          {
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            address: user.address,
            needsWallet: !user.gateHubUserId,
            needsIDProof: !user.kycVerified,
            customerId: user.customerId,
            isCardsVisible: user.isCardsVisible
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
    res: CustomResponse<ValidTokenResponse>,
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

  changeCardsVisibility = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    const { id: userId } = req.session.user

    try {
      const {
        body: { isCardsVisible }
      } = await validate(changeCardsVisibilitySchema, req)

      await this.userService.changeCardsVisibility(isCardsVisible, userId)

      res.json(toSuccessResponse(undefined, 'Cards visibility changed'))
    } catch (e) {
      next(e)
    }
  }
}
