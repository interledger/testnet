import { validate } from '@/shared/validate'
import { NextFunction, Request } from 'express'
import { AuthService } from './service'
import { logInSchema, signUpSchema } from './validation'
import { UserService } from '@/user/service'
import { Unauthorized } from '@/errors'
import { Controller, toSuccessResponse } from '@shared/backend'

interface IAuthController {
  signUp: Controller
  logIn: Controller
  verifyEmail: Controller
}

export class AuthController implements IAuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  // We use arrow functions to maintain the correct `this` reference
  signUp = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { email, password }
      } = await validate(signUpSchema, req)

      await this.authService.signUp({ email, password })

      res
        .status(201)
        .json(toSuccessResponse(undefined, 'User created successfully'))
    } catch (e) {
      next(e)
    }
  }

  logIn = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { email, password }
      } = await validate(logInSchema, req)

      const { user, session } = await this.authService.authorize({
        email,
        password
      })

      req.session.id = session.id
      req.session.user = {
        id: user.id,
        email: user.email,
        needsWallet: !user.rapydWalletId,
        needsIDProof: !user.kycId
      }

      await req.session.save()

      res.json({ success: true, message: 'Authorized' })
    } catch (e) {
      next(e)
    }
  }

  logOut = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      if (!req.session.id || !req.session.user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      await this.authService.logout(req.session.user.id)
      req.session.destroy()

      res.json({ success: true, message: 'SUCCESS' })
    } catch (e) {
      next(e)
    }
  }

  verifyEmail = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const token = req.params.token

      await this.userService.verifyEmail(token)

      res.json({
        success: true,
        message: 'Email was verified successfully'
      })
    } catch (e) {
      next(e)
    }
  }
}
