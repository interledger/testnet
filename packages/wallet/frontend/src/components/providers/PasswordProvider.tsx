import { PasswordContext } from '@/lib/context/password'
import { ReactNode, useState } from 'react'

type PasswordProviderProps = {
  children: ReactNode
}

export const PasswordProvider = ({ children }: PasswordProviderProps) => {
  const [isChangePassword, setIsChangePassword] = useState(false)

  return (
    <PasswordContext.Provider
      value={{
        isChangePassword,
        setIsChangePassword
      }}
    >
      {children}
    </PasswordContext.Provider>
  )
}
