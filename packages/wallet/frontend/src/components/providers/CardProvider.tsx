import { CardContext, CardTypes } from '@/lib/context/card'
import { ReactNode, useState } from 'react'

type CardProviderProps = {
  children: ReactNode
}

export const CardProvider = ({ children }: CardProviderProps) => {
  const [cardType, setCardType] = useState('normal' as CardTypes)

  return (
    <CardContext.Provider
      value={{
        cardType,
        setCardType
      }}
    >
      {children}
    </CardContext.Provider>
  )
}
