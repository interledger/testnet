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

export interface ICreateManagedUserResponse {}

export interface ICreateTransactionRequest {
  amount: number
  receiving_amount?: string
  sending_address: string
  receiving_address: string
  message: string
  type: 'transfer'
  vault_uuid: string
}

export interface ICreateTransactionResponse {}

export interface IGetVaultsResponse {}
