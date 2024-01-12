import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { PasswordProvider } from './PasswordProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <OnboardingProvider>
      <PasswordProvider>
        <DialogProvider>{children}</DialogProvider>
      </PasswordProvider>
    </OnboardingProvider>
  )
}
