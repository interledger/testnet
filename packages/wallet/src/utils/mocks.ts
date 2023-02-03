type Asset = {
  scale: number
  code: string
}

export type Account = {
  id: string
  name: string
  asset: Asset
}

export const mockAccount = (): Account => ({
  id: Math.random().toString(36).slice(2, -1),
  name: `Account ${Math.floor(Math.random() * 100) + 1}`,
  asset: mockAsset()
})

export const mockAsset = (): Asset => ({
  scale: Math.floor(Math.random() * 10) + 1,
  code: (Math.random() + 1).toString(36).slice(2, 5).toUpperCase()
})

export const mockAccountList = (): Account[] => [
  mockAccount(),
  mockAccount(),
  mockAccount(),
  mockAccount(),
  mockAccount()
]
