import { Button } from '@/components/ui/button.tsx'
import { useCartStore } from '@/hooks/use-cart-store.ts'
import { formatPrice } from '@/lib/utils.ts'
import { useMemo } from 'react'

export const OrderSummary = () => {
  const { totalAmount } = useCartStore()
  const orderSubTotal = useMemo(() => formatPrice(totalAmount), [totalAmount])

  return (
    <section className="mt-16 rounded-lg bg-green-1 px-4 py-6 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8">
      <h2 className="text-lg font-bold">Summary</h2>
      <dl className="mt-6 space-y-4">
        <div className="flex items-center justify-between font-medium">
          <dt>Subtotal</dt>
          <dd className="font-bold">{orderSubTotal}</dd>
        </div>
        <div className=" flex items-center justify-between border-t border-green pt-4 font-medium">
          <dt>Fees</dt>
          <dd className="text-sm">Fees will be calculated at checkout</dd>
        </div>
        <div className="flex items-center justify-between border-t border-green pt-4 font-medium">
          <dt>Estimated order total</dt>
          <dd className="font-bold">{orderSubTotal}</dd>
        </div>
      </dl>
      <div className="mt-6 flex">
        <Button aria-label="go to checkout" className="w-full">
          Checkout
        </Button>
      </div>
    </section>
  )
}
