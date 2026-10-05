import { User } from '@/user/model'
import { initErrorHandler, initLogger, RedisClient } from '@shared/backend'
import type { NextFunction, Request } from 'express'
import { TypedResponse } from '@shared/backend/src'

export const createUser = (args: Partial<User>) => {
  return User.query().insertAndFetch(args)
}

export const createFakeRedisClient = (): RedisClient => {
  const store = new Map<string, string>()

  return {
    async get<T>(key: string): Promise<T | null> {
      const value = store.get(key)
      return value ? (JSON.parse(value) as T) : null
    },
    async set<T>(key: string, value: T | string): Promise<string> {
      store.set(key, typeof value === 'string' ? value : JSON.stringify(value))
      return 'OK'
    },
    async setIfNotExists<T>(key: string, value: T | string): Promise<boolean> {
      if (store.has(key)) {
        return false
      }
      store.set(key, typeof value === 'string' ? value : JSON.stringify(value))
      return true
    },
    async delete(key: string): Promise<number> {
      return store.delete(key) ? 1 : 0
    }
  } as unknown as RedisClient
}

export const errorHandler: (
  e: Error,
  req: Request,
  res: TypedResponse,
  next: NextFunction
) => void = initErrorHandler(initLogger('test'))
