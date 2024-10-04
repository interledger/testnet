import { createContext, Dispatch, SetStateAction, useContext } from 'react'

export interface Keys {
  /** Base64 encoded key */
  publicKey: string
  privateKey: CryptoKey
}

type KeysContextProps = {
  keys: Keys | null
  setKeys: Dispatch<SetStateAction<KeysContextProps['keys']>>
}

export const KeysContext = createContext<KeysContextProps | null>(null)

export const useKeysContext = () => {
  const keysContext = useContext(KeysContext)

  if (!keysContext) {
    throw new Error('"useKeysContext" is used outside the KeysContextProvider.')
  }

  return keysContext
}
