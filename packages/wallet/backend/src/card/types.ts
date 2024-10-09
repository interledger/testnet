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
  walletAddress: string
  account: {
    productCode: string
    currency: 'EUR'
    card: {
      productCode: string
    }
  }
  nameOnCard: string
  citizen: {
    name: string
    surname: string
    birthPlace?: string | null
  }
}

export interface ICitizen {
  name: string
  surname: string
  birthDate?: string | null
  birthPlace?: string | null
  gender?: 'Female' | 'Male' | 'Unspecified' | 'Unknown' | null
  title?: string | null
  language?: string | null
}

export interface ILegalEntity {
  longName: string
  shortName: string
  sector?:
    | 'Public'
    | 'Private'
    | 'Corporate'
    | 'Others'
    | 'NoInformation'
    | 'UnrelatedPersonsLegalEntities'
    | null
  industrialClassificationProvider?: string | null
  industrialClassificationValue?: string | null
  type?: string | null
  vat?: string | null
  hqCustomerId?: number | null
  contactPerson?: string | null
  agentCode?: string | null
  agentName?: string | null
}

export interface IAddress {
  sourceId?: string | null
  type: 'PermanentResidence' | 'Work' | 'Other' | 'TemporaryResidence'
  countryCode: string
  line1: string
  line2?: string | null
  line3?: string | null
  city: string
  postOffice?: string | null
  zipCode: string
  status?: 'Inactive' | 'Active' | null
  id?: string | null
  customerId?: string | null
  customerSourceId?: string | null
}

export interface ICommunication {
  sourceId?: string | null
  type: 'Email' | 'Mobile'
  value?: string | null
  id?: string | null
  status?: 'Inactive' | 'Active' | null
  customerId?: string | null
  customerSourceId?: string | null
}

export interface IAccount {
  sourceId?: string | null
  type?: 'CHARGE' | 'LOAN' | 'DEBIT' | 'PREPAID' | null
  productCode?: string | null
  accountNumber?: string | null
  feeProfile?: string | null
  accountProfile?: string | null
  id?: string | null
  customerId?: string | null
  customerSourceId?: string | null
  status?: 'ACTIVE' | 'LOCKED' | 'BLOCKED' | null
  statusReasonCode?:
    | 'TemporaryBlockForDelinquency'
    | 'TemporaryBlockOnIssuerRequest'
    | 'TemporaryBlockForDepo'
    | 'TemporaryBlockForAmlKyc'
    | 'IssuerRequestGeneral'
    | 'UserRequest'
    | 'PremanentBlockChargeOff'
    | 'IssuerRequestBureauInquiry'
    | 'IssuerRequestCustomerDeceased'
    | 'IssuerRequestStornoFromCollectionStraight'
    | 'IssuerRequestStornoFromCollectionDepo'
    | 'IssuerRequestStornoFromCollectionDepoPaid'
    | 'IssuerRequestHandoverToAttorney'
    | 'IssuerRequestLegalAction'
    | 'IssuerRequestAmlKyc'
    | null
  currency?: string | null
  cards?: ICardResponse[] | null
}

export interface ICreateCustomerResponse {
  walletAddress: string
  customers: {
    sourceId?: string | null
    taxNumber?: string | null
    code: string
    type: 'Citizen' | 'LegalEntity'
    citizen?: ICitizen | null
    legalEntity?: ILegalEntity | null
    id?: string | null
    addresses?: IAddress[] | null
    communications?: ICommunication[] | null
    accounts?: IAccount[] | null
  }
}

export interface ICardResponse {
  sourceId: string
  nameOnCard: string
  productCode: string
  id: string
  accountId: string
  accountSourceId: string
  maskedPan: string
  status: string
  statusReasonCode: string | null
  lockLevel: string | null
  expiryDate: string
  customerId: string
  customerSourceId: string
}

export type CardLimitType =
  | 'perTransaction'
  | 'dailyOverall'
  | 'weeklyOverall'
  | 'monthlyOverall'
  | 'dailyAtm'
  | 'dailyEcomm'
  | 'monthlyOpenScheme'
  | 'nonEUPayments'

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
