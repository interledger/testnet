import { createContext, useContext, useState, type ReactNode } from 'react'

type KYCFormContextProps = {
  tab: number
  setTab: (tab: number) => void
  disabled: boolean
  setDisabled: (isDisabled: boolean) => void
}

const KYCFormContext = createContext<KYCFormContextProps | null>(null)

export const useKYCFormContext = () => {
  const formContext = useContext(KYCFormContext)

  if (!formContext) {
    throw new Error(
      '"useKYCFormContext" is used outside the KYCFormContextProvider.'
    )
  }

  return formContext
}

export const KYCFormContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [tab, setTab] = useState(0)
  const [disabled, setDisabled] = useState(true)
  return (
    <KYCFormContext.Provider value={{ tab, setTab, disabled, setDisabled }}>
      {children}
    </KYCFormContext.Provider>
  )
}
