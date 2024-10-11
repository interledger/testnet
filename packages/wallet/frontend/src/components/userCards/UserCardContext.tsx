import { IUserCard } from '@/lib/api/card'
import { useRouter } from 'next/router'
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction
} from 'react'

export interface ICardData {
  Pan: string
  ExpiryDate: string
  Cvc2: string
}

interface UserCardContextValue {
  showDetails: boolean
  setShowDetails: Dispatch<SetStateAction<boolean>>
  card: IUserCard
  cardData: ICardData | null
  setCardData: Dispatch<SetStateAction<UserCardContextValue['cardData']>>
}

export const UserCardContext = createContext({} as UserCardContextValue)

export const useCardContext = () => {
  const cardContext = useContext(UserCardContext)

  if (!cardContext) {
    throw new Error(
      '"useCardContext" is used outside the UserCardContext provider.'
    )
  }

  return cardContext
}

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

type KeysProviderProps = {
  children: ReactNode
}

export const KeysProvider = ({ children }: KeysProviderProps) => {
  const { pathname } = useRouter()
  const [keys, setKeys] = useState<Keys | null>(null)
  const { setCardData, setShowDetails } = useCardContext()

  useEffect(() => {
    async function generateKeyPair() {
      const keyPair = await crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 4096,
          publicExponent: new Uint8Array([0x01, 0x00, 0x01]),
          hash: { name: 'SHA-256' }
        },
        true,
        ['encrypt', 'decrypt']
      )

      const exported = await crypto.subtle.exportKey('spki', keyPair.publicKey)
      const buf = new Uint8Array(exported)
      const str = String.fromCharCode.apply(null, Array.from<number>(buf))
      const publicKeyBase64 = btoa(str)

      setKeys({ publicKey: publicKeyBase64, privateKey: keyPair.privateKey })
    }

    if (!keys) {
      generateKeyPair()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (pathname !== '/cards') {
      setCardData(null)
      setShowDetails(false)
    }
  }, [pathname, setCardData, setShowDetails])

  return (
    <KeysContext.Provider value={{ keys, setKeys }}>
      {children}
    </KeysContext.Provider>
  )
}
