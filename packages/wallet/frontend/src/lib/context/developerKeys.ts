import { createContext, useContext } from 'react'

type DeveloperKeysContextProps = {
  selectedDevKeys: {
    accountId: string
    walletAddressId: string
    keyId: string
  }[]
  setSelectedDevKeys: (
    devKeys: { accountId: string; walletAddressId: string; keyId: string }[]
  ) => void
  revokeMultiple: boolean
  setRevokeMultiple: (showCheckBoxes: boolean) => void
}

export const DeveloperKeysContext =
  createContext<DeveloperKeysContextProps | null>(null)

export const useDeveloperKeysContext = () => {
  const developerKeysContext = useContext(DeveloperKeysContext)

  if (!developerKeysContext) {
    throw new Error(
      '"developerKeysContext" is used outside the DeveloperKeysContextProvider.'
    )
  }

  return developerKeysContext
}
