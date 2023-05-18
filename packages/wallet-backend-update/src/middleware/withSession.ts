import { env } from '@/config/env'
import type { NextFunction, Request, Response } from 'express'
import { IronSessionOptions } from 'iron-session'
import { ironSession } from 'iron-session/express'

export const SESSION_OPTIONS: IronSessionOptions = {
  password: env.COOKIE_PASSWORD,
  cookieName: env.COOKIE_NAME,
  cookieOptions: {
    secure: env.NODE_ENV === 'production',
    sameSite: 'none',
    httpOnly: true
  },
  ttl: env.COOKIE_TTL
} as const

export const withSession: (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void> = ironSession(SESSION_OPTIONS)
