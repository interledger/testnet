import { EntryOptions, IRedisClient } from './redis-client'

export interface ICacheService<T> {
  set(key: string, value: T | string): Promise<string>
  get(key: string): Promise<T | null>
  delete(key: string): Promise<number>
}

export class Cache<T> implements ICacheService<T> {
  private namespace: string = 'Testnet:'

  constructor(
    private cache: IRedisClient,
    namespace: string
  ) {
    this.namespace = this.namespace + namespace + ':'
  }

  async set(
    key: string,
    value: T | string,
    options?: EntryOptions
  ): Promise<string> {
    const namespacedKey = this.namespace + key
    return await this.cache.set<T>(namespacedKey, value, options)
  }

  async get(key: string): Promise<T | null> {
    const namespacedKey = this.namespace + key
    return await this.cache.get<T>(namespacedKey)
  }

  async delete(key: string): Promise<number> {
    const namespacedKey = this.namespace + key
    return await this.cache.delete(namespacedKey)
  }
}
