export interface ICardDetailsResponse {
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
