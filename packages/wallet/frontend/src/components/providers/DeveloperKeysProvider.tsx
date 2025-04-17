import { DeveloperKeysContext } from '@/lib/context/developerKeys'
import { ReactNode, useState } from 'react'

type DeveloperKeysProviderProps = {
  children: ReactNode
}

export const DeveloperKeysProvider = ({
  children
}: DeveloperKeysProviderProps) => {
  const [selectedDevKeys, setSelectedDevKeys] = useState<string[]>([])
  const [revokeMultiple, setRevokeMultiple] = useState(false)

  return (
    <DeveloperKeysContext.Provider
      value={{
        selectedDevKeys,
        setSelectedDevKeys,
        revokeMultiple,
        setRevokeMultiple
      }}
    >
      {children}
    </DeveloperKeysContext.Provider>
  )
}
