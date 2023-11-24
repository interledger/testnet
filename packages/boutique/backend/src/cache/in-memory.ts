interface CacheData<TData> {
  data: TData
  expires: number | null
  createdAt: number
}

export class InMemoryCache<TData> {
  protected cache: Map<string, CacheData<TData>>

  constructor() {
    this.cache = new Map()
  }

  set(key: string, value: TData, ttl?: number): void {
    const now = Date.now()
    const expires = ttl ? now + ttl : null
    this.cache.set(key, { data: value, expires, createdAt: now })
  }

  async get(key: string): Promise<TData | null> {
    const cached = this.cache.get(key)

    if (!cached) {
      return null
    }

    if (cached.expires !== null && cached.expires < Date.now()) {
      this.delete(key)
      return null
    }

    return cached.data
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  processExpired(): string | undefined {
    const now = Date.now()
    for (const [key, data] of this.cache.entries()) {
      const { expires } = data

      if (!expires) return

      if (expires && expires < now) {
        this.cache.delete(key)
      }
    }
  }
}
