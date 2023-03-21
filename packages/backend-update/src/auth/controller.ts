import type { Env } from '@/config/env'
import { Unauthorized } from '@/errors'
import { validate } from '@/shared/validate'
import { User } from '@/user/model'
import { addSeconds } from 'date-fns'
import { NextFunction, Request } from 'express'
import type { Logger } from 'winston'

import { AuthService } from './service'
import { logInSchema, signUpSchema } from './validation'

interface IAuthController {
  register: (
    req: Request,
    res: CustomResponse,
    next: NextFunction
  ) => Promise<void>
}

export class AuthController implements IAuthController {
  constructor(
    private authService: AuthService,
    private env: Env,
    private logger: Logger
  ) {}

  // We use arrow functions to maintain the correct `this` reference
  register = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { email, password } = await validate(signUpSchema, req)

      await this.authService.signUp({ email, password })

      res
        .status(201)
        .json({ success: true, message: 'User created successfully' })
    } catch (e) {
      this.logger.error(e)
      next(e)
    }
  }

  login = async (req: Request, res: CustomResponse, next: NextFunction) => {
    try {
      const { email, password } = await validate(logInSchema, req)
      const user = await User.query().findOne({ email })

      if (!user) {
        throw new Unauthorized('Invalid credentials')
      }

      const isValid = await user.verifyPassword(password)

      if (!isValid) {
        throw new Unauthorized('Invalid credentials')
      }

      const session = await user.$relatedQuery('sessions').insertAndFetch({
        userId: user.id,
        expiresAt: addSeconds(new Date(), this.env.COOKIE_TTL)
      })
      console.log(req.session)
      req.session.id = session.id
      req.session.user = {
        id: user.id,
        email: user.email,
        needsWallet: !user.rapydWalletId,
        needsIDProof: !user.kycId
      }
      await req.session.save()

      return res.json({ success: true, message: 'Logged in' })
    } catch (e) {
      this.logger.error(e)
      next(e)
    }
  }
}
