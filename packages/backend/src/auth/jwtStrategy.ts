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
      // find the user in db if exists

      // const user = await User.query().findById(jwtPayload.id)
      const { expiration, userId } = jwtPayload

      if (Date.now() > expiration) {
        done('Unauthorized', false)
      }
      // if (!user) {
      //   return done(null, false)
      // }

      //* Return user to add it to req???

      return done(null, { id: Number(userId) } as User)
    } catch (error) {
      done(error)
    }
  }
)
