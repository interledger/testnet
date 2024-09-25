import { env } from '@/config/env'
import Redis from 'ioredis'
import { RateLimiterRedisHelper } from '@/rateLimit/service'
import { NextFunction, Request, Response } from 'express'

const redisClient = new Redis(env.REDIS_URL)

const sendEmailLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: 'send_email',
  points: env.SEND_EMAIL_RATE_LIMIT,
  duration: env.SEND_EMAIL_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
  blockDuration: env.SEND_EMAIL_RATE_LIMIT_PAUSE_IN_SECONDS
})
const loginAttemptLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: 'login_email',
  points: env.LOGIN_RATE_LIMIT,
  duration: env.LOGIN_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
  blockDuration: env.LOGIN_RATE_LIMIT_PAUSE_IN_SECONDS
})
const loginIPLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: 'login_ip',
  points: env.LOGIN_IP_RATE_LIMIT,
  duration: env.LOGIN_IP_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
  blockDuration: env.LOGIN_IP_RATE_LIMIT_PAUSE_IN_SECONDS
})
const loginBlockIPLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: 'login_block_ip',
  points: env.LOGIN_IP_BLOCK_RATE_LIMIT,
  duration: env.LOGIN_IP_BLOCK_RATE_LIMIT_RESET_INTERVAL_IN_SECONDS,
  blockDuration: env.LOGIN_IP_BLOCK_RATE_LIMIT_PAUSE_IN_SECONDS
})

export const rateLimiterEmail = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
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
