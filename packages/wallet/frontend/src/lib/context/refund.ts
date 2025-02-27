import { createContext, useContext } from 'react'

type RefundContextProps = {
  receiverWalletAddress: string
  setReceiverWalletAddress: (receiverWalletAddress: string) => void
}

export const RefundContext = createContext<RefundContextProps | null>(null)

export const useRefundContext = () => {
  const refundContext = useContext(RefundContext)

  if (!refundContext) {
    throw new Error(
      '"useRefundContext" is used outside the RefundContextProvider.'
    )
  }

  return refundContext
}
