export type LockReasonCode =
  | 'ClientRequestedLock'
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'
