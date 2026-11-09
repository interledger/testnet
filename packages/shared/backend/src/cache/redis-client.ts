import { Redis } from 'ioredis'

export type EntryOptions = {
  expiry?: number
}

export interface IRedisClient {
  set<T>(
    key: string,
    value: T | string,
    options?: EntryOptions
  ): Promise<string>
  setIfNotExists<T>(
    key: string,
    value: T | string,
    options?: EntryOptions
  ): Promise<boolean>
  get<T>(key: string): Promise<T | null>
  delete(key: string): Promise<number>
}

export class RedisClient implements IRedisClient {
  constructor(private redis: Redis) {}

  async set<T>(
    key: string,
    value: T | string,
    options?: EntryOptions
  ): Promise<string> {
    const serializedValue = this.serialize(value)

    if (options?.expiry) {
      return await this.redis.set(key, serializedValue, 'EX', options.expiry)
    }

    return await this.redis.set(key, serializedValue)
  }

  // Returns true only for the caller that claimed the key.
  async setIfNotExists<T>(
    key: string,
    value: T | string,
    options?: EntryOptions
  ): Promise<boolean> {
    const serializedValue = this.serialize(value)

    const result =
      options?.expiry !== undefined
        ? await this.redis.set(key, serializedValue, 'EX', options.expiry, 'NX')
        : await this.redis.set(key, serializedValue, 'NX')

    return result === 'OK'
  }

  async get<T>(key: string): Promise<T | null> {
    const serializedValue = await this.redis.get(key)
    if (serializedValue) {
      return typeof serializedValue === 'string'
        ? (JSON.parse(serializedValue) as T)
        : serializedValue
    }
    return null
  }

  async delete(key: string): Promise<number> {
    return await this.redis.del(key)
  }

  private serialize<T>(value: T | string): string {
    return typeof value === 'string' ? value : JSON.stringify(value)
  }
}
