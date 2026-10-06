// Wallet-owned shapes for Rhyza data. Not generated from any Rhyza or GraphQL artifact.

// Rhyza identifies assets by code alone; scale is a display property.
export interface Asset {
  code: string
  scale: number
}

export type GrantState =
  | 'PROCESSING'
  | 'PENDING'
  | 'APPROVED'
  | 'ISSUED'
  | 'REJECTED'
  | 'REVOKED'

export interface GrantAmount {
  value: string
  assetCode: string
  assetScale: number
}

export interface GrantAccessLimits {
  receiver?: string
  interval?: string
  debitAmount?: GrantAmount
  receiveAmount?: GrantAmount
}

export interface GrantAccess {
  type: string
  actions: string[]
  identifier?: string
  limits?: GrantAccessLimits
}

export interface GrantSubjectId {
  format: string
  id: string
}

export interface Grant {
  id: string
  state: GrantState
  access: GrantAccess[]
  subjectIds: GrantSubjectId[]
}
