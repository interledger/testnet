import { Env } from '@/config/env'
import { Redis } from 'ioredis'
import { RedisClient } from '@shared/backend'
let redisClient: Redis | null = null

export const createRedisClient = (env: Env): Redis => {
  redisClient = new Redis(env.REDIS_URL)

  redisClient.on('error', (err) => {
    console.error('Redis error:', err)
  })

  return redisClient
}

export const getRedisClient = (env: Env): Redis | null => {
  if (!redisClient) {
    return createRedisClient(env)
  }
  return redisClient
}

export function createRedis(env: Env) {
  const redis = new Redis(env.REDIS_URL)
  return new RedisClient(redis)
}
