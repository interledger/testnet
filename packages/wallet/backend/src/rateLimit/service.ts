import Redis from 'ioredis'
import {
  RateLimiterRes,
  RateLimiterRedis,
  IRateLimiterRedisOptions
} from 'rate-limiter-flexible'

import type { Env } from '@/config/env'
import { TooManyRequests } from '@shared/backend'

interface getLimiterlArgs {
  key: string
  maxWrongAttempts: number
  wrongAttemptsPause: number
}
interface IRateLimitService {
  buildLimiter(args: getLimiterlArgs): Promise<RateLimiterRedis>
}
interface IRateLimiterRedisHelper {
  checkAttempts(inputKey: string): Promise<void>
  useAttempt(inputKey: string): Promise<void>
}
export class RateLimiterRedisHelper
  extends RateLimiterRedis
  implements IRateLimiterRedisHelper
{
  private attempts: number
  constructor(opts: IRateLimiterRedisOptions) {
    super(opts)
    this.attempts = opts.points || 1
  }

  public async checkAttempts(inputKey: string) {
    let retrySecs = 0
    try {
      const resSlowByEmail = await this.get(inputKey)

      if (
        resSlowByEmail !== null &&
        resSlowByEmail.consumedPoints > this.attempts
      ) {
        retrySecs = Math.ceil(resSlowByEmail.msBeforeNext / 60000) || 1
      }
    } catch (err) {
      console.log(`Error checking limiter attempt`, err)
    }

    if (retrySecs > 0) {
      throw new TooManyRequests(
        `Too many requests. Retry after ${retrySecs} minutes.`
      )
    }
  }
  public async useAttempt(inputKey: string) {
    try {
      await this.consume(inputKey)
    } catch (err) {
      if (err instanceof RateLimiterRes) {
        const timeOut = String(Math.ceil(err.msBeforeNext / 60000)) || 1
        throw new TooManyRequests(
          `Too many attempts. Retry after ${timeOut} minutes`
        )
      } else {
        console.log(`Error consuming limiter attempt`, err)
      }
    }
  }
}
export class RateLimitService implements IRateLimitService {
  private redisClient: Redis
  constructor(private env: Env) {
    const redis_url = this.env.REDIS_URL
    this.redisClient = new Redis(redis_url)
  }

  public async buildLimiter({
    key,
    maxWrongAttempts,
    wrongAttemptsPause
  }: getLimiterlArgs) {
    return new RateLimiterRedisHelper({
      storeClient: this.redisClient,
      keyPrefix: key,
      points: maxWrongAttempts,
      duration: 60 * 60 * 24,
      blockDuration: 60 * wrongAttemptsPause
    })
  }
}
