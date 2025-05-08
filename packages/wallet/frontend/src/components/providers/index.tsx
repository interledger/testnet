import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { PasswordProvider } from './PasswordProvider'
import { MenuProvider } from './MenuProvider'
import { RefundProvider } from './RefundProvider'
import { DeveloperKeysProvider } from './DeveloperKeysProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <MenuProvider>
      <OnboardingProvider>
        <RefundProvider>
          <PasswordProvider>
            <DeveloperKeysProvider>
              <DialogProvider>{children}</DialogProvider>
            </DeveloperKeysProvider>
          </PasswordProvider>
        </RefundProvider>
      </OnboardingProvider>
    </MenuProvider>
  )
}
