export interface Asset {
  id: string
  code: string
  scale: number
  withdrawalThreshold?: bigint
  createdAt: string
}

export interface Rates {
  base: string
  rates: Record<string, number>
}
