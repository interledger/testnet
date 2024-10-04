import { KeysContext, Keys } from '@/lib/context/keys'
import { ReactNode, useState } from 'react'

type KeysProviderProps = {
  children: ReactNode
}

export const KeysProvider = ({ children }: KeysProviderProps) => {
  const [keys, setKeys] = useState<Keys | null>(null)

  return (
    <KeysContext.Provider value={{ keys, setKeys }}>
      {children}
    </KeysContext.Provider>
  )
}
