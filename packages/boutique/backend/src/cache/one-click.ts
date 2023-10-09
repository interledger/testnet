import { InMemoryCache } from './in-memory'

export type OneClickCacheData = {
  continueUri: string
  continueToken: string
}

export type OneClickCache = InMemoryCache<OneClickCacheData>
