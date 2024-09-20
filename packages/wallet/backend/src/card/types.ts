export interface IMaskedCardDetailsResponse {
  sourceId: string | null
  nameOnCard: string | null
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

export interface ICardDetailsResponse {}

export interface ILinksResponse {
  token: string | null
  links: Array<{
    href: string | null
    rel: string | null
    method: string | null
  }> | null
}
