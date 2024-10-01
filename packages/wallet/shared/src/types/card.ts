export type LockReasonCode =
  | 'ClientRequestedLock'
  | 'LostCard'
  | 'StolenCard'
  | 'IssuerRequestGeneral'
  | 'IssuerRequestFraud'
  | 'IssuerRequestLegal'

export type CardLimitType =
  | 'perTransaction'
  | 'dailyOverall'
  | 'weeklyOverall'
  | 'monthlyOverall'
  | 'dailyAtm'
  | 'dailyEcomm'
  | 'monthlyOpenScheme'
  | 'nonEUPayments'
