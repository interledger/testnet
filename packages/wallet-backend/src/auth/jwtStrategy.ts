import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt'
import { Request } from 'express'
import { User } from '../user/models/user'
import env from '../config/env'
import { UnauthorisedException } from './errors/UnauthorisedException'

export const jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (request: Request): string => {
        return request?.cookies?.AccessToken as string
      }
    ]),
    secretOrKey: env.JWT_ACCESS_TOKEN_SECRET,
    passReqToCallback: true
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async (req: Request, jwtPayload: any, done: any) => {
    const { userId, email, noKyc } = jwtPayload

    if (noKyc && req.url !== '/wallet') {
      return done(new UnauthorisedException('Account has no KYC'), false)
    }
    return done(null, { id: userId, email } as User)
  }
)
