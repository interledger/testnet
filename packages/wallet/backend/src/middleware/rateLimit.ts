import { env } from '@/config/env'
import { RateLimiterRedisHelper } from '@/rateLimit/service'
import { NextFunction, Request, Response } from 'express'
import { getRedisClient } from '@/config/redis'

export const rateLimiterEmail = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sendEmailLimiter = new RateLimiterRedisHelper({
      storeClient: getRedisClient(env),
      keyPrefix: 'send_email',
      points: env.SEND_EMAIL_RATE_LIMIT,
      duration: env.SEND_EMAIL_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
      blockDuration: env.SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS
    })
    await sendEmailLimiter.checkAttempts(req.body.email)
    await sendEmailLimiter.useAttempt(req.body.email)
  } catch (e) {
    next(e)
  }

  next()
}
export const rateLimiterLogin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userIp = `${req.ip}`
    const loginAttemptLimiter = new RateLimiterRedisHelper({
      storeClient: getRedisClient(env),
      keyPrefix: 'login_email',
      points: env.LOGIN_RATE_LIMIT,
      duration: env.LOGIN_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
      blockDuration: env.LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS
    })
    const loginIPLimiter = new RateLimiterRedisHelper({
      storeClient: getRedisClient(env),
      keyPrefix: 'login_ip',
      points: env.LOGIN_IP_RATE_LIMIT,
      duration: env.LOGIN_IP_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
      blockDuration: env.LOGIN_IP_RATE_LIMIT_PAUSE_IN_SECONDS
    })
    const loginBlockIPLimiter = new RateLimiterRedisHelper({
      storeClient: getRedisClient(env),
      keyPrefix: 'login_block_ip',
      points: env.LOGIN_IP_BLOCK_RATE_LIMIT,
      duration: env.LOGIN_IP_BLOCK_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
      blockDuration: env.LOGIN_IP_BLOCK_RATE_LIMIT_PAUSE_IN_SECONDS
    })

    await loginBlockIPLimiter.checkAttempts(userIp)
    await loginBlockIPLimiter.useAttempt(userIp)

    await loginIPLimiter.checkAttempts(userIp)
    await loginIPLimiter.useAttempt(userIp)

    await loginAttemptLimiter.checkAttempts(req.body.email)
    await loginAttemptLimiter.useAttempt(req.body.email)
  } catch (e) {
    next(e)
  }
  next()
}
