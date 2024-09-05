import { AssetOP } from './asset'
import { WalletAddressKeyResponse } from './WalletAddressKey'

export interface IWalletAddressResponse {
  id: string
  url: string
  publicName: string
  accountId: string
}

export interface WalletAddressResponse extends IWalletAddressResponse {
  keys: WalletAddressKeyResponse[]
}

export type WalletAddressOP = AssetOP & {
  id: string
  publicName: string
  authServer: string
}
