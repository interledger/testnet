import { ab2str } from '@/utils/helpers'
import { ICardResponse } from '@wallet/shared'
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
  card: ICardResponse
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
  publicKey: string
  privateKey: string
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
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: { name: 'SHA-256' }
        },
        true,
        ['encrypt', 'decrypt']
      )

      const exportedPrivateKey = await crypto.subtle.exportKey(
        'pkcs8',
        keyPair.privateKey
      )
      const privateKey = `-----BEGIN PRIVATE KEY-----\n${btoa(ab2str(exportedPrivateKey))}\n-----END PRIVATE KEY-----`

      const exportedPublicKey = await crypto.subtle.exportKey(
        'spki',
        keyPair.publicKey
      )
      const publicKey = btoa(ab2str(exportedPublicKey))

      setKeys({
        publicKey,
        privateKey
      })
    }

    if (!keys) {
      void generateKeyPair()
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

export function isLockedCard(card: ICardResponse): boolean {
  return card.lockLevel === 'Client'
}
