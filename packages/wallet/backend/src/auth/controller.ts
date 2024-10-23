import { validate } from '@/shared/validate'
import { NextFunction, Request } from 'express'
import { AuthService } from './service'
import {
  logInBodySchema,
  signUpBodySchema,
  emailBodySchema
} from './validation'
import { UserService } from '@/user/service'
import { Controller, toSuccessResponse, Unauthorized } from '@shared/backend'

interface IAuthController {
  signUp: Controller
  logIn: Controller
  verifyEmail: Controller
  resendVerifyEmail: Controller
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
        body: { email, password, acceptedCardTerms }
      } = await validate(signUpBodySchema, req)

      await this.authService.signUp({ email, password, acceptedCardTerms })

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
      } = await validate(logInBodySchema, req)

      const { user, session } = await this.authService.authorize({
        email,
        password
      })

      req.session.id = session.id
      req.session.user = {
        id: user.id,
        email: user.email,
        // TODO: REMOVE NEEDSWALLET
        needsWallet: !user.gateHubUserId,
        needsIDProof: !user.kycVerified,
        customerId: user.customerId
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

  resendVerifyEmail = async (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => {
    try {
      const {
        body: { email }
      } = await validate(emailBodySchema, req)

      await this.authService.resendVerifyEmail({ email })

      res
        .status(201)
        .json(
          toSuccessResponse(
            undefined,
            'Verification email has been sent successfully'
          )
        )
    } catch (e) {
      next(e)
    }
  }
}
