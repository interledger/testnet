import { CardLimitType } from '@wallet/shared/src'

export interface ICardDetailsRequest {
  cardId: string
  publicKeyBase64: string
}

export interface ICardDetailsResponse {
  cipher: string | null
}

export interface ILinksResponse {
  token: string | null
  links: Array<{
    href: string | null
    rel: string | null
    method: string | null
  }> | null
}

export interface ICreateCustomerRequest {
  emailAddress: string
  account: {
    productCode: string
  }
  card: {
    productCode: string
  }
  user: {
    firstName: string
    lastName: string
    mobileNumber?: string
    nationalIdentifier?: string
  }
  identification: {
    documents: Array<{
      type: string
      file: string // Base64-encoded file content
    }>
  }
  address: {
    addressLine1: string
    addressLine2?: string
    city: string
    region?: string
    postalCode: string
    countryCode: string
  }
}

export interface ICreateCustomerResponse {
  customerId: string
  accountId: string
  cardId: string
}

export interface ICardProductLimit {
  type: CardLimitType
  currency: string
  limit: string
  isDisabled: boolean
}

export interface ICardProductResponse {
  cardProductLimits: ICardProductLimit[]
  deletedAt: string | null
  uuid: string
  accountProductCode: string
  code: string
  name: string
  cost: string
}

export interface ICardLockRequest {
  note: string
}

export interface ICardUnlockRequest {
  note: string
}

export interface ICardLimitRequest {
  type: CardLimitType
  limit: string
  currency: string
  isDisabled: boolean
}

export interface ICardLimitResponse {
  type: CardLimitType
  limit: number
  currency: string
  isDisabled: boolean
}
