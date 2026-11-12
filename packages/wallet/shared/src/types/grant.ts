export type GrantState = 'APPROVED' | 'FINALIZED' | 'PENDING' | 'PROCESSING'

export type GrantFinalization = 'ISSUED' | 'REJECTED' | 'REVOKED'

type PaymentAmount = {
  value: string
  assetCode: string
  assetScale: number
  formattedAmount?: string
}

export type Access = {
  id: string
  identifier: string | null
  actions: string[]
  type: string
  limits: {
    receiver: string | null
    debitAmount: PaymentAmount | null
    receiveAmount: PaymentAmount | null
    interval: string | null
    intervalHR?: string
  } | null
}

type Subject = {
  sub_ids: {
    id: string
    format: string
  }[]
}

export interface GrantResponse {
  id: string
  client: string
  state: GrantState
  createdAt: string
  access: Access[]
  finalizationReason?: GrantFinalization
  subject?: Subject
}

// Max wallet addresses per grants list request
export const GRANTS_MAX_WALLET_ADDRESSES = 50

export type GrantsPageInfo = {
  startCursor?: string
  endCursor?: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export interface GrantsListResponse {
  grants: GrantResponse[]
  pageInfo: GrantsPageInfo
}
