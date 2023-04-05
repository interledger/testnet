import { validate } from '@/shared/validate'
import { NextFunction, Request } from 'express'
import type { Logger } from 'winston'
import { AuthService } from './service'
import { logInSchema, signUpSchema } from './validation'
import { UserService } from '@/user/service'

interface IAuthController {
  signUp: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
  logIn: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}

export class AuthController implements IAuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private logger: Logger
  ) {}

  // We use arrow functions to maintain the correct `this` reference
  signUp = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { email, password } = await validate(signUpSchema, req)

      await this.userService.create({ email, password })

      res
        .status(201)
        .json({ success: true, message: 'User created successfully' })
    } catch (e) {
      this.logger.error(e)
      next(e)
    }
  }

  logIn = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { email, password } = await validate(logInSchema, req)

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
      this.logger.error(e)
      next(e)
    }
  }
}
