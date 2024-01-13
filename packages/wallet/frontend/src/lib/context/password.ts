import { createContext, useContext } from 'react'

type PasswordContextProps = {
  isChangePassword: boolean
  setIsChangePassword: (isUserFirstTime: boolean) => void
}

export const PasswordContext = createContext<PasswordContextProps | null>(null)

export const usePasswordContext = () => {
  const passwordContext = useContext(PasswordContext)

  if (!passwordContext) {
    throw new Error(
      '"usePasswordContext" is used outside the PasswordContextProvider.'
    )
  }

  return passwordContext
}
