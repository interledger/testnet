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

export const SANDBOX_VAULT_IDS: Record<string, string> = {
  USD: '450d2156-132a-4d3f-88c5-74822547658d',
  EUR: 'a09a0a2c-1a3a-44c5-a1b9-603a6eea9341',
  GBP: '992b932d-7e9e-44b0-90ea-b82a530b6784',
  ZAR: 'f1c412ce-5e2b-4737-9121-b7c11d6c3f93',
  MXN: '426c2e30-111e-4273-92b3-508445a6bb58'
}
export const PRODUCTION_VAULT_IDS: Record<string, string> = {
  USD: '5e1ff913-96d4-45ab-b7a3-04197a59fe06',
  EUR: '546ac540-4362-49cb-b639-afc5d4280d03'
}

export enum DepositTypeEnum {
  HOSTED = 'hosted',
  EXTERNAL = 'external'
}
