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
  meta: Record<string, string>
  lastPasswordChange: string
  features: string[]
  managed: boolean
  managedBy: string
}

export interface ICreateWalletRequest {
  name: string
  type: number
}

export interface ICreateWalletResponse {
  address: string
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
  type: number
  vault_uuid: string
}

export interface ICreateTransactionResponse {}

export interface IGetVaultsResponse {}
