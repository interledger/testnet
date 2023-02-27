type Asset = {
  scale: number
  code: string
}

export type Account = {
  id: string
  name: string
  asset: Asset
  balance: number
}

const assetCodes = ['EUR', 'USD', 'XRP', 'CAD', 'GBP']

export const mockAccount = (): Account => ({
  id: Math.random().toString(36).slice(2, -1),
  name: `Account ${Math.floor(Math.random() * 100) + 1}`,
  asset: mockAsset(),
  balance: parseFloat((Math.random() * 1000 + 100).toPrecision(5))
})

export const mockAsset = (): Asset => ({
  scale: Math.floor(Math.random() * 10) + 1,
  code: assetCodes[Math.floor(Math.random() * assetCodes.length)]
})

export const mockAccountList = (): Account[] => [
  mockAccount(),
  mockAccount(),
  mockAccount(),
  mockAccount()
]
