import { InMemoryCache } from '@shared/backend'

export type OneClickCacheData = {
  walletAddressUrl: string
  clientNonce: string
  interactNonce: string
  continueUri: string
  continueToken: string
}

export type OneClickCache = InMemoryCache<OneClickCacheData>
