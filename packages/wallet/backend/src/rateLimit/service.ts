import {
  RateLimiterRes,
  RateLimiterRedis,
  IRateLimiterRedisOptions
} from 'rate-limiter-flexible'

import { TooManyRequests } from '@shared/backend'

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
