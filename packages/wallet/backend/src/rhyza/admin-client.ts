import { HttpClient } from '@/rhyza/http-client'
import { Asset, WalletAddress, Payment, Pagination } from '@/rhyza/types'

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

export interface ListPaymentsArgs {
  walletAddressId?: string
  paymentIntentId?: string
  cursor?: string
  first?: number
  last?: number
  sortOrder?: 'asc' | 'desc'
}

export interface ListPaymentsResponse {
  result: Payment[]
  pagination: Pagination
}

export interface RegisterWalletAddressKeyArgs {
  /** Cryptographic algorithm used with the key. The only allowed value is `EdDSA`. */
  alg: 'EdDSA'
  /** Cryptographic curve that the key pair is derived from. The only allowed value is `Ed25519`. */
  crv: 'Ed25519'
  /** Unique identifier for the key. */
  kid: string
  /** Key type. The only allowed value is `OKP`. */
  kty: 'OKP'
  /** Base64 url-encoded public key. */
  x: string
  /** Intended use of the key. */
  use?: 'sig'
}

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

  async listPayments(args: ListPaymentsArgs): Promise<ListPaymentsResponse> {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined) query.set(key, String(value))
    }

    const path = query.size > 0 ? `/payments?${query.toString()}` : '/payments'
    return this.http.get<ListPaymentsResponse>(path)
  }

  async registerWalletAddressKey(
    jwk: RegisterWalletAddressKeyArgs,
    walletAddressId: string
  ): Promise<{ id: string }> {
    const response = await this.http.post<{ id: string }>(
      `/wallet-addresses/${walletAddressId}/keys`,
      jwk
    )
    return { id: response.id }
  }
}
