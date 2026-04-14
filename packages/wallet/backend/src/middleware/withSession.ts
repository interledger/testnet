import { env } from '@/config/env'
import type { NextFunction, Request, Response } from 'express'
import {
  type SessionOptions,
  type IronSession,
  getIronSession
} from 'iron-session'

// Determine cookie domain. Avoid setting Domain=localhost — browsers ignore it.
// The wallet frontend is served on the bare RAFIKI_MONEY_FRONTEND_HOST domain
// (e.g. testnet.test) while the backend sits on a subdomain (api.testnet.test).
// A server is allowed to set cookies for any ancestor domain, so
// api.testnet.test can legitimately issue Domain=testnet.test and the browser
// will send it back to both testnet.test and api.testnet.test.
let domain: string | undefined = undefined
domain = env.RAFIKI_MONEY_FRONTEND_HOST
// Fail fast if domain is not set or empty
if (!domain || domain.trim() === '') {
  console.error(
    'RAFIKI_MONEY_FRONTEND_HOST environment variable is not set or empty'
  )
  process.exit(1)
}
// Remove protocol and trailing slashes if present
domain = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')

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
