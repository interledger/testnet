import { Env } from '@/config/env'
import { Redis } from 'ioredis'
import { RedisClient } from '@shared/backend'

export function createRedis(env: Env) {
  const redis = new Redis(env.REDIS_URL)
  return new RedisClient(redis)
}
