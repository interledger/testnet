import { TransactionTypeEnum } from '@/gatehub/consts'

export type HTTP_METHODS = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

export interface IClientIds {
  onOffRamp: string
  exchange: string
  onboarding: string
}

export interface ITokenRequest {
  scope: string[]
}

export interface ITokenResponse {
  token: string
  expires: string
}

export interface ICreateManagedUserRequest {
  email: string
}

export interface ICreateManagedUserResponse {
  id: string
  createdAt: string
  updatedAt: string
  activatedAt: string
  email: string
  secret2fa: boolean
  type2fa: string
  activated: boolean
  role: string
  meta: {
    meta: {
      paymentPointer: string
      customerId: string
    }
  } & Record<string, string>
  lastPasswordChange: string
  features: string[]
  managed: boolean
  managedBy: string
}

export interface IGetUserStateResponse {
  profile: {
    first_name: string
    last_name: string
    address_country_code: string
    address_city: string
    address_street1: string
    address_street2: string
  }
}

export interface ICreateWalletRequest {
  name: string
  type: number
}

export interface ICreateWalletResponse {
  address: string
}

export interface IGetWalletForUserResponse {
  wallets: ICreateWalletResponse[]
}

export interface IGetWalletResponse {
  address: string
}

export interface ICreateTransactionRequest {
  amount: number
  receiving_amount?: string
  sending_address: string
  receiving_address: string
  message: string
  type: TransactionTypeEnum.HOSTED
  vault_uuid: string
}
export interface IFundAccountRequest {
  uid: string
  amount: number
  network: number
  receiving_address: string
  type: TransactionTypeEnum.DEPOSIT
  vault_uuid: string
}

export interface ICreateTransactionResponse {}

export interface IGetVaultsResponse {}

export interface IRatesResponse {
  counter: string
  [key: string]: string | IRate
}

interface IRate {
  type: string
  rate: string | number
  amount: string
  change: string
}

export interface IWalletBalance {
  available: string
  pending: string
  total: string
  vault: IVault
}

interface IVault {
  uuid: string
  name: string
  asset_code: string
  created_at: string
  updated_at: string
}

export interface IConnectUserToGatewayResponse {}
export interface IApproveUserToGatewayRequest {
  verified: number
  reasons: string[]
  customMessage: boolean
}
export interface IApproveUserToGatewayResponse {}

export interface IOverrideUserRiskLevelRequest {
  risk_level: string
  reason: string
}
export interface IOverrideUserRiskLevelResponse {}

export interface IWebhookDate {
  uuid: string
  timestamp: string
  event_type: string
  user_uuid: string
  environment: 'sandbox' | 'production'
  data: Record<string, unknown>
}
