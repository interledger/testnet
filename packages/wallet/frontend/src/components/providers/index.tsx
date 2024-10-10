import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { PasswordProvider } from './PasswordProvider'
import { MenuProvider } from './MenuProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <MenuProvider>
      <OnboardingProvider>
        <PasswordProvider>
          <DialogProvider>{children}</DialogProvider>
        </PasswordProvider>
      </OnboardingProvider>
    </MenuProvider>
  )
}
