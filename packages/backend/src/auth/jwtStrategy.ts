import { ExtractJwt, Strategy as JWTStrategy } from 'passport-jwt'
import { Request } from 'express'
import { User } from '../user/models/user'

export const jwtStrategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJwt.fromExtractors([
      (request: Request): string => {
        return request?.cookies?.AccessToken as string
      }
    ]),
    secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET
  },
  async (jwtPayload, done) => {
    try {
      const { expiration, userId } = jwtPayload

      if (Date.now() > expiration) {
        done('Unauthorized', false)
      }
      return done(null, { id: userId } as User)
    } catch (error) {
      done(error)
    }
  }
)
