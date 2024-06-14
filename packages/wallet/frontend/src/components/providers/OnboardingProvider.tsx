import { ReactNode, useState } from 'react'
import { OnboardingContext } from '../../lib/context/onboarding'

type OnboardingProviderProps = {
  children: ReactNode
}

export const OnboardingProvider = ({ children }: OnboardingProviderProps) => {
  const [runOnboarding, setRunOnboarding] = useState(true)
  const [stepIndex, setStepIndex] = useState(0)
  const [isUserFirstTime, setIsUserFirstTime] = useState(false)
  const [isDevKeysOnboarding, setIsDevKeysOnboarding] = useState(false)

  return (
    <OnboardingContext.Provider
      value={{
        runOnboarding,
        setRunOnboarding,
        stepIndex,
        setStepIndex,
        isUserFirstTime,
        setIsUserFirstTime,
        isDevKeysOnboarding,
        setIsDevKeysOnboarding
      }}
    >
      {children}
    </OnboardingContext.Provider>
  )
}
