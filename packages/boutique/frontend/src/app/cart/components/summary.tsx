import { OneClickSetupDialog } from '@/app/cart/components/one-click-setup'
import { Button } from '@/components/ui/button.tsx'

import { useCartStore } from '@/hooks/use-cart-store.ts'
import { useTokenStore } from '@/hooks/use-token-store'
import { resetToken } from '@/lib/stores/token-store'
import { formatPrice } from '@/lib/utils.ts'
import { ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'

const SummarySection = ({ children }: { children: ReactNode }) => {
  return (
    <section className="rounded-lg bg-green-light dark:bg-purple-dark px-4 py-6 sm:p-6 lg:p-8">
      {children}
    </section>
  )
}

export const Summary = () => {
  const { accessToken } = useTokenStore()
  const { totalAmount, items } = useCartStore()
  const orderSubTotal = useMemo(() => formatPrice(totalAmount), [totalAmount])

  if (totalAmount === 0 && accessToken) {
    return (
      <div className="mx-auto mt-10 w-2/3 border-t border-t-gray-200 lg:col-span-12">
        <div className="mt-10 flex justify-center">
          <Button
            aria-label="remove one click buy"
            variant="error"
            onClick={() => resetToken()}
          >
            Disable one click buy
          </Button>
        </div>
      </div>
    )
  }

  if (totalAmount === 0 && !accessToken) {
    return (
      <div className="mx-auto mt-10 border-t border-t-gray-200 lg:col-span-12">
        <div className="mt-10 flex justify-center">
          <OneClickSetupDialog />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-16 flex flex-col gap-y-5 lg:col-span-4 lg:mt-0">
      <SummarySection>
        <h2 className="text-lg font-['DejaVuSansMonoBold']">Summary</h2>
        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt>Subtotal</dt>
            <dd className="font-['DejaVuSansMonoBold']">{orderSubTotal}</dd>
          </div>
          <div className="flex items-center justify-between border-t border-green-dark dark:border-teal-neon pt-4">
            <dt>Fees</dt>
            <dd className="text-sm">Fees will be calculated at checkout</dd>
          </div>
          <div className="flex items-center justify-between border-t border-green-dark dark:border-teal-neon pt-4">
            <dt>Estimated order total</dt>
            <dd className="font-['DejaVuSansMonoBold']">{orderSubTotal}</dd>
          </div>
        </dl>
        <div className="mt-6 flex">
          <Button aria-label="go to checkout" className="w-full" asChild>
            <Link to="/checkout" state={JSON.stringify({ items, totalAmount })}>
              Checkout
            </Link>
          </Button>
        </div>
      </SummarySection>
      <SummarySection>
        {accessToken ? (
          <Button
            className="w-full"
            aria-label="remove one click buy"
            variant="error"
            onClick={() => resetToken()}
          >
            Disable one click buy
          </Button>
        ) : (
          <OneClickSetupDialog buttonClassName="w-full" />
        )}
      </SummarySection>
    </div>
  )
}
