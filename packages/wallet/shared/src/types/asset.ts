export type AssetOP = {
  assetCode: string
  assetScale: number
}

export interface AssetResponse {
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}
