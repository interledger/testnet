import { createContext, useContext } from 'react'

type OnboardingContextProps = {
  runOnboarding: boolean
  setRunOnboarding: (run: boolean) => void
  stepIndex: number
  setStepIndex: (stepIndex: number) => void
  isUserFirstTime: boolean
  setIsUserFirstTime: (isUserFirstTime: boolean) => void
  isPaymentsSkipped: boolean
  setIsPaymentsSkipped: (isPaymentsSkipped: boolean) => void
}

export const OnboardingContext = createContext<OnboardingContextProps | null>(
  null
)

export const useOnboardingContext = () => {
  const onboardingContext = useContext(OnboardingContext)

  if (!onboardingContext) {
    throw new Error(
      '"useOnboardingContext" is used outside the OnboardingContextProvider.'
    )
  }

  return onboardingContext
}
