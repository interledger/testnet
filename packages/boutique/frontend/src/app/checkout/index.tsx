import { Navigate, useLocation } from 'react-router-dom'
import { PaymentMethods } from './components/payment-methods.tsx'
import { OrderSummary, Summary } from './components/order-summary.tsx'

export function Component() {
  const location = useLocation()
  const state = JSON.parse(location.state) as Summary

  if (!state) {
    return <Navigate to={'/'} replace />
  }

  return (
    <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-x-16 lg:grid-cols-2 lg:px-8 xl:gap-x-48">
      <PaymentMethods />
      <OrderSummary summary={state} />
    </div>
  )
}
