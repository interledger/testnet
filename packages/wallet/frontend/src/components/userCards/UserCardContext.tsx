import { ICardResponse } from '@wallet/shared'
import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction
} from 'react'

interface UserCardContextValue {
  showDetails: boolean
  setShowDetails: Dispatch<SetStateAction<boolean>>
  card: ICardResponse
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
