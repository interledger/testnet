import { env } from '@/config/env'
import type { NextFunction, Request, Response } from 'express'
import {
  type SessionOptions,
  type IronSession,
  getIronSession
} from 'iron-session'

let domain = env.RAFIKI_MONEY_FRONTEND_HOST

if (env.NODE_ENV === 'production' && env.GATEHUB_ENV === 'production') {
  domain = 'interledger.cards'
}

export const SESSION_OPTIONS: SessionOptions = {
  password: env.COOKIE_PASSWORD,
  cookieName: env.COOKIE_NAME,
  cookieOptions: {
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
    domain,
    httpOnly: true
  },
  ttl: env.COOKIE_TTL
} as const

// Utility from a previous version of iron-session.
// https://github.com/vvo/iron-session/blob/v6.3.1/src/getPropertyDescriptorForReqSession.ts
function getPropertyDescriptorForReqSession(
  session: IronSession<IronSessionData>
): PropertyDescriptor {
  return {
    enumerable: true,
    get() {
      return session
    },
    set(value) {
      const keys = Object.keys(value)
      const currentKeys = Object.keys(session)

      currentKeys.forEach((key) => {
        if (!keys.includes(key)) {
          // @ts-expect-error unknown keys
          delete session[key]
        }
      })

      keys.forEach((key) => {
        // @ts-expect-error unknown keys
        session[key] = value[key]
      })
    }
  }
}

export const withSession: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> = async (req, res, next) => {
  const session = await getIronSession<IronSessionData>(
    req,
    res,
    SESSION_OPTIONS
  )
  Object.defineProperty(
    req,
    'session',
    getPropertyDescriptorForReqSession(session)
  )

  next()
}
