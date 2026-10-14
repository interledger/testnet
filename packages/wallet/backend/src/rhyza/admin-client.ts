import { HttpClient } from '@/rhyza/http-client'
import { Asset, WalletAddress } from '@/rhyza/types'

interface AssetCreateResponse {
  code: string
}

export interface CreateWalletAddressArgs {
  address: string
  assetCode: string
  publicName: string
  isActive?: boolean
}

interface WalletAddressCreateResponse {
  id: string
  address: string
}

// interface ListAssetsResponse {
//   code: string
//   scale: number
// }

export class RhyzaAdminClient {
  constructor(private http: HttpClient) {}

  async createAsset(code: string, scale: number): Promise<Asset> {
    const response = await this.http.post<AssetCreateResponse>('/assets', {
      code,
      scale
    })
    // The response carries only the code.
    return { code: response.code, scale }
  }

  async createWalletAddress(
    args: CreateWalletAddressArgs
  ): Promise<WalletAddress> {
    const response = await this.http.post<WalletAddressCreateResponse>(
      '/wallet-addresses',
      args
    )
    return { id: response.id, address: response.address }
  }

  async listAssets(): Promise<Asset[]> {
    // const response = await this.http.get<ListAssetsResponse[]>('/assets')
    // return response.map(({ code, scale }) => ({ code, scale }))
    return [
      { code: 'USD', scale: 2 },
      { code: 'EUR', scale: 2 }
    ]
  }
}
