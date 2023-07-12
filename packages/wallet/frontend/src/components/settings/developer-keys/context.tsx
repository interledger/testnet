import { PaymentPointer } from '@/lib/api/paymentPointer'
import { createContext, ReactNode, useContext } from 'react'

type PaymentPointerContextType = {
  paymentPointer: PaymentPointer
  paymentPointersCount: number
  paymentPointerIdx: number
}

const PaymentPointerContext = createContext<
  PaymentPointerContextType | undefined
>(undefined)

type PaymentPointerProviderProps = PaymentPointerContextType & {
  children: ReactNode
}

export const usePaymentPointerContext = (): PaymentPointerContextType => {
  const context = useContext(PaymentPointerContext)
  if (!context) {
    throw new Error(
      'usePaymentPointerContext must be used within an PaymentPointerProvider'
    )
  }
  return context
}

export const PaymentPointerProvider = ({
  children,
  paymentPointer,
  paymentPointerIdx,
  paymentPointersCount
}: PaymentPointerProviderProps) => {
  return (
    <PaymentPointerContext.Provider
      value={{ paymentPointer, paymentPointersCount, paymentPointerIdx }}
    >
      {children}
    </PaymentPointerContext.Provider>
  )
}
