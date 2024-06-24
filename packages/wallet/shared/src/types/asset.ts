export type AssetOP = {
  assetCode: string
  assetScale: number
}

export interface AssetResponse {
  id: string
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}
