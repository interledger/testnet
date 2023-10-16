import { EntryOptions, IRedisClient } from './redis-client';

export interface ICacheService{
    set<T>(key: string, value: T | string): Promise<string>;
    get<T>(key: string): Promise<T | null>;
    delete(key: string): Promise<number>;
}

export class CacheService implements ICacheService{
    private namespace: string = 'Testnet:';

  constructor(private cache: IRedisClient, namespace: string) {
    this.namespace = this.namespace + namespace + ':';
  }

  async set<T>(key: string, value: T | string, options?: EntryOptions ): Promise<string> {
    const namespacedKey = this.namespace + key;
    return await this.cache.set(namespacedKey, value, options);
  }

  async get<T>(key: string): Promise<T | null> {
    const namespacedKey = this.namespace + key;
    return await this.cache.get(namespacedKey);
  }

  async delete(key: string): Promise<number> {
    const namespacedKey = this.namespace + key;
    return await this.cache.delete(namespacedKey);
  }

}
