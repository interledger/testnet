import { IClientIds } from '@/gatehub/types'

export const DEFAULT_APP_SCOPE = ['gatewayapi', 'auth', 'core', 'id']
export const ONBOARDING_APP_SCOPE = [...DEFAULT_APP_SCOPE, 'storage']

export const SANDBOX_CLIENT_IDS: IClientIds = {
  onOffRamp: 'f8119dfd-e563-44ee-9ae2-1e60a4fce74f',
  onboarding: '4df24d1b-5796-4eec-951b-21699d61b970',
  exchange: '4e28d4df-22d7-414c-97a3-d71956df29ba'
}
export const PRODUCTION_CLIENT_IDS: IClientIds = {
  onOffRamp: 'f4c8f30f-7fc3-4aa1-8573-520cb67565e3',
  onboarding: '40a22fc5-9091-4c6f-aff6-a3fddf475b33',
  exchange: '50e7c590-f6f9-4fa9-9498-260bd978c5d6'
}

export enum PAYMENT_TYPE {
  withdrawal = 'withdrawal',
  deposit = 'deposit'
}

export const HOSTED_WALLET_TYPE = 0
export const MANUAL_NETWORK = 8

export enum TransactionTypeEnum {
  HOSTED = 2,
  DEPOSIT = 1
}

export const SUPPORTED_ASSET_CODES = ['USD', 'EUR']
