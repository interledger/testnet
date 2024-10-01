export type LockReasonCode =
  | 'ClientRequestedLock'
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'

export type BlockReasonCode =
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'
  | 'IssuerRequestIncorrectOpening'
  | 'CardDamagedOrNotWorking'
  | 'UserRequest'
  | 'IssuerRequestCustomerDeceased'
  | 'ProductDoesNotRenew';