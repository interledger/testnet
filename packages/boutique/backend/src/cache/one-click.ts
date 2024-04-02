import { Cache, RedisClient } from '@shared/backend'

export type OneClickCacheData = {
  walletAddressUrl: string
  clientNonce: string
  interactNonce: string
  continueUri: string
  continueToken: string
}

export type OneClickCache = Cache<OneClickCacheData>

export const createOneClickCache = (redisClient: RedisClient) =>
  new Cache<OneClickCacheData>(redisClient, 'one-click')
