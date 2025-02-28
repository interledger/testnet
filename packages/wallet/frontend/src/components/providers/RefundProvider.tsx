import { RefundContext } from '@/lib/context/refund'
import { ReactNode, useState } from 'react'

type RefundProviderProps = {
  children: ReactNode
}

export const RefundProvider = ({ children }: RefundProviderProps) => {
  const [receiverWalletAddress, setReceiverWalletAddress] = useState('')

  return (
    <RefundContext.Provider
      value={{
        receiverWalletAddress,
        setReceiverWalletAddress
      }}
    >
      {children}
    </RefundContext.Provider>
  )
}
