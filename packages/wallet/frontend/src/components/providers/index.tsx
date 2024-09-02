import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'
import { OnboardingProvider } from './OnboardingProvider'
import { PasswordProvider } from './PasswordProvider'
import { ThemeProvider } from 'next-themes'
import { MenuProvider } from './MenuProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      themes={['light', 'dark']}
    >
      <MenuProvider>
        <OnboardingProvider>
          <PasswordProvider>
            <DialogProvider>{children}</DialogProvider>
          </PasswordProvider>
        </OnboardingProvider>
      </MenuProvider>
    </ThemeProvider>
  )
}
