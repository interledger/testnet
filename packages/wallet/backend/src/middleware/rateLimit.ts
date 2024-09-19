import { env } from '@/config/env'
import Redis from 'ioredis'
import { RateLimiterRedisHelper } from '@/rateLimit/service'
import { NextFunction, Request, Response } from 'express'

const redisClient = new Redis(env.REDIS_URL)
const sendEmailLimiterArgs = {
  key: 'send_email',
  maxAttempts: 1,
  attemptsPause: 60
}
const loginBlockIPLimiterAtrs = {
  key: 'login_block_ip',
  maxAttempts: 500,
  attemptsPause: 24 * 60
}
const loginIPLimiterAtrs = {
  key: 'login_fail_ip',
  maxAttempts: 30,
  attemptsPause: 60
}
const loginAttemptLimiterAtrs = {
  key: 'login_fail_email',
  maxAttempts: 3,
  attemptsPause: 10
}

const sendEmailLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: sendEmailLimiterArgs.key,
  points: sendEmailLimiterArgs.maxAttempts,
  duration: 60 * 60 * 24,
  blockDuration: 60 * sendEmailLimiterArgs.attemptsPause
})
const loginAttemptLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: loginAttemptLimiterAtrs.key,
  points: loginAttemptLimiterAtrs.maxAttempts,
  duration: 60 * 60 * 24,
  blockDuration: 60 * loginAttemptLimiterAtrs.attemptsPause
})
const loginIPLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: loginIPLimiterAtrs.key,
  points: loginIPLimiterAtrs.maxAttempts,
  duration: 60 * 60 * 1,
  blockDuration: 60 * loginIPLimiterAtrs.attemptsPause
})
const loginBlockIPLimiter = new RateLimiterRedisHelper({
  storeClient: redisClient,
  keyPrefix: loginBlockIPLimiterAtrs.key,
  points: loginBlockIPLimiterAtrs.maxAttempts,
  duration: 60 * 60 * 1,
  blockDuration: 60 * loginBlockIPLimiterAtrs.attemptsPause
})
const EmailRoutes = ['/resend-verify-email', '/forgot-password']
export const rateLimiterEmail = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (EmailRoutes.includes(req.url)) {
      await sendEmailLimiter.checkAttempts(req.body.email)
      await sendEmailLimiter.useAttempt(req.body.email)
    }
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
