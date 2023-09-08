export class InMemoryCache<T> {
  private cache: Map<string, { data: T; expires: number | null }>

  constructor() {
    this.cache = new Map()
  }

  set(key: string, value: T, ttl?: number): void {
    const expires = ttl ? Date.now() + ttl : null
    this.cache.set(key, { data: value, expires })
  }

  get(key: string): T | null {
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
}
