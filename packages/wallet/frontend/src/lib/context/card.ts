import { createContext, useContext } from 'react'

const CARD_TYPES = {
  normal: 'normal',
  details: 'details',
  frozen: 'frozen'
} as const

export type CardTypes = keyof typeof CARD_TYPES

type CardContextProps = {
  cardType: CardTypes
  setCardType: (cardType: CardTypes) => void
}

export const CardContext = createContext<CardContextProps | null>(null)

export const useCardContext = () => {
  const cardContext = useContext(CardContext)

  if (!cardContext) {
    throw new Error('"useCardContext" is used outside the CardContextProvider.')
  }

  return cardContext
}
