const GRANT_STATE = {
  APPROVED: 'APPROVED',
  FINALIZED: 'FINALIZED',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING'
} as const
type GrantState = keyof typeof GRANT_STATE

const GRANT_FINALIZATION = {
  ISSUED: 'ISSUED',
  REJECTED: 'REJECTED',
  REVOKED: 'REVOKED'
}
type GrantFinalization = keyof typeof GRANT_FINALIZATION

type PaymentAmount = {
  value: string
  assetCode: string
  assetScale: number
  formattedAmount?: string
}

type Access = {
  id: string
  identifier: string | null
  actions: string[]
  type: string
  limits: {
    receiver: string | null
    debitAmount: PaymentAmount | null
    receiveAmount: PaymentAmount | null
    interval: string | null
  } | null
}

export interface GrantResponse {
  id: string
  client: string
  state: GrantState
  createdAt: string
  access: Access[]
  finalizationReason?: GrantFinalization
}

type GrantNode = {
  cursor: string
  node: GrantResponse
}

type GrantsPageInfo = {
  endCursor: string
  startCursor: string
  hasNextPage: boolean
  hasPreviousPage: boolean
}
export interface GrantsListResponse {
  grants: {
    edges: GrantNode[]
    pageInfo: GrantsPageInfo
  }
}
