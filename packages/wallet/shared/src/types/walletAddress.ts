import { AssetOP } from './asset'
import { WalletAddressKeyResponse } from './walletAddressKey'

export interface IWalletAddressResponse {
  id: string
  url: string
  publicName: string
  accountId: string
  incomingBalance: bigint
  outgoingBalance: bigint
  assetCode?: string | null
  assetScale?: number | null
}

export interface WalletAddressResponse extends IWalletAddressResponse {
  keys: WalletAddressKeyResponse[]
}

export type WalletAddressOP = AssetOP & {
  id: string
  publicName: string
  authServer: string
}
