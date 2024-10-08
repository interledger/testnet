export enum GateHubMessageType {
  WithdrawalError = 'WithdrawalError',
  WithdrawalCompleted = 'WithdrawalCompleted',
  ExchangeError = 'ExchangeError',
  ExchangeCompleted = 'ExchangeCompleted',
  OnboardingError = 'OnboardingError',
  OnboardingInitialized = 'OnboardingInitialized',
  OnboardingCompleted = 'OnboardingCompleted'
}

export type GateHubMessageError = { code?: string; message: string }
