export type Asset = {
  id: string
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}

export type Rates = {
  base: string
  rates: Record<string, number>
}

export type AssetOP = {
  assetCode: string
  assetScale: number
}

export type ExchangeRates = Record<string, number>
