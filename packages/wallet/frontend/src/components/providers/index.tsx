import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <OnboardingProvider>
      <DialogProvider>{children}</DialogProvider>
    </OnboardingProvider>
  )
}
