import { ReactNode } from 'react'
import { DialogProvider } from './DialogProvider'

type AppProviderProps = {
  children: ReactNode
}

export const AppProvider = ({ children }: AppProviderProps) => {
  return <DialogProvider>{children}</DialogProvider>
}
