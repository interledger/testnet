import { createContext, useContext, useState, type ReactNode } from 'react'

type KYCFormContextProps = {
  tab: number
  setTab: (tab: number) => void
}

const KYCFormContext = createContext<KYCFormContextProps | null>(null)

export const useKYCFormContext = () => {
  const formContext = useContext(KYCFormContext)

  if (!formContext) {
    throw new Error('"useFormContext" is used outside the FormContextProvider.')
  }

  return formContext
}

export const KYCFormContextProvider = ({
  children
}: {
  children: ReactNode
}) => {
  const [tab, setTab] = useState(0)
  return (
    <KYCFormContext.Provider value={{ tab, setTab }}>
      {children}
    </KYCFormContext.Provider>
  )
}
