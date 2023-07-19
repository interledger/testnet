import { validate } from '@/shared/validate'
import { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { AuthService } from './service'
import { logInSchema, signUpSchema } from './validation'
import { UserService } from '@/user/service'
import { Unauthorized } from '@/errors'
import { env } from '@/config/env'

interface IAuthController {
  signUp: ControllerFunction
  logIn: ControllerFunction
}
interface AuthControllerDependencies {
  authService: AuthService
  userService: UserService
  logger: Logger
}

export class AuthController implements IAuthController {
  constructor(private deps: AuthControllerDependencies) {}

  // We use arrow functions to maintain the correct `this` reference
  signUp = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { email, password }
      } = await validate(signUpSchema, req)

      await this.deps.userService.create({ email, password })

      res
        .status(201)
        .json({ success: true, message: 'User created successfully' })
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }

  logIn = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const {
        body: { email, password }
      } = await validate(logInSchema, req)

      const { user, session } = await this.deps.authService.authorize({
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
      this.deps.logger.error(e)
      next(e)
    }
  }

  logOut = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      if (!req.session.id || !req.session.user) {
        req.session.destroy()
        throw new Unauthorized('Unauthorized')
      }

      await this.deps.authService.logout(req.session.user.id)
      req.session.destroy()
      res.clearCookie(env.COOKIE_NAME)

      res.json({ success: true, message: 'SUCCESS' })
    } catch (e) {
      this.deps.logger.error(e)
      next(e)
    }
  }
}
