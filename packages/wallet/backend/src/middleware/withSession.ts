import { env } from '@/config/env'
import {
  isCookieDomainUsableFrom,
  normalizeHost,
  normalizeRequestHost
} from '@/utils/hosts'
import type { NextFunction, Request, Response } from 'express'
import {
  type SessionOptions,
  type IronSession,
  getIronSession
} from 'iron-session'
import type { Logger } from 'winston'

// Determine cookie domain. Avoid setting Domain=localhost — browsers ignore it.
// The wallet frontend is served on the bare RAFIKI_MONEY_FRONTEND_HOST domain
// (e.g. testnet.test) while the backend sits on a subdomain (api.testnet.test).
// A server is allowed to set cookies for any ancestor domain, so
// api.testnet.test can legitimately issue Domain=testnet.test and the browser
// will send it back to both testnet.test and api.testnet.test.
// See `@/utils/hosts` for why the bare domain is the only workable value.
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
domain = normalizeHost(domain)

export const COOKIE_DOMAIN = domain

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

/**
 * Detects the one misconfiguration that cannot be caught at startup: the
 * backend issuing a cookie for a domain the browser will refuse, because the
 * request host is not the cookie domain or one of its descendants.
 *
 * When this happens the login response still looks completely healthy — 200,
 * Set-Cookie present — but the browser drops the cookie, so every subsequent
 * request is anonymous and users are bounced back to the login page. Nothing
 * else in the stack reports it, so log it loudly here. Warned hosts are
 * remembered so a broken deployment logs once per host rather than per
 * request.
 *
 * `Host` is client-controlled, so the set of remembered hosts is normalized
 * (case and port cannot produce duplicate entries for one host) and hard
 * capped. Once the cap is hit the deployment is unambiguously misconfigured and
 * further logging would add nothing, so we stop — an attacker sending a stream
 * of junk hosts can neither grow this memory nor flood the log.
 */
const MAX_WARNED_HOSTS = 16

export const warnOnUnusableCookieDomain = (logger: Logger) => {
  const warnedHosts = new Set<string>()

  return (req: Request, _res: Response, next: NextFunction): void => {
    const rawHost = req.headers.host
    const host = rawHost ? normalizeRequestHost(rawHost) : ''

    if (
      host &&
      warnedHosts.size < MAX_WARNED_HOSTS &&
      !warnedHosts.has(host) &&
      !isCookieDomainUsableFrom(host, COOKIE_DOMAIN)
    ) {
      warnedHosts.add(host)
      logger.error(
        `Session cookie is unusable: this server answers requests for "${host}" ` +
          `but issues cookies for Domain="${COOKIE_DOMAIN}". Browsers will ` +
          `discard the cookie and every login will silently fail. Set ` +
          `RAFIKI_MONEY_FRONTEND_HOST to a domain that "${host}" sits under ` +
          `(usually the bare apex domain).`,
        { requestHost: host, cookieDomain: COOKIE_DOMAIN }
      )
    }

    next()
  }
}

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
