import { InMemoryCache } from './in-memory'

export type OneClickCacheData = {
  paymentPointerUrl: string
  clientNonce: string
  interactNonce: string
  continueUri: string
  continueToken: string
}

export type OneClickCache = InMemoryCache<OneClickCacheData>
