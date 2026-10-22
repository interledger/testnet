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

export interface CreatePaymentIntentArgs {
  walletAddress: string
  incomingAmount: number
  expiresAt?: string
  metadata?: string
}

export interface PaymentIntentAmount {
  value: string
  assetCode: string
  assetScale: number
}

export interface GetPaymentIntentResponse {
  id: string
  createdAt: string
  state: 'CREATED' | 'COMPLETED'
  destination: string
  walletAddress: string
  incomingAmount: PaymentIntentAmount
  receivedAmount: PaymentIntentAmount
  expiresAt: string
  destinationIlpAddress: string
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

  async createPaymentIntent(
    args: CreatePaymentIntentArgs
  ): Promise<{ id: string; openPaymentsUrl: string }> {
    const response = await this.http.post<{
      id: string
      openPaymentsUrl: string
    }>('/payment-intents', args)
    return { id: response.id, openPaymentsUrl: response.openPaymentsUrl }
  }

  async getPaymentIntentById(id: string): Promise<GetPaymentIntentResponse> {
    const response = await this.http.get<GetPaymentIntentResponse>(
      `/payment-intents/${id}`
    )

    return response
  }
}
