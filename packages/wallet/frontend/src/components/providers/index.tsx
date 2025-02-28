import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { PasswordProvider } from './PasswordProvider'
import { MenuProvider } from './MenuProvider'
import { RefundProvider } from './RefundProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <MenuProvider>
      <OnboardingProvider>
        <RefundProvider>
          <PasswordProvider>
            <DialogProvider>{children}</DialogProvider>
          </PasswordProvider>
        </RefundProvider>
      </OnboardingProvider>
    </MenuProvider>
  )
}
