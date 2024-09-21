import { IMAGES_URL } from '@/lib/constants.ts'
import { CartItem } from '@/lib/stores/cart-store.ts'
import { useThemeContext } from '@/lib/theme'
import { formatPrice } from '@/lib/utils.ts'

export interface Summary {
  items: CartItem[]
  totalAmount: number
}

interface OrderSummaryProps {
  summary: Summary
}

export const OrderSummary = ({ summary }: OrderSummaryProps) => {
  const { theme } = useThemeContext()
  return (
    <section className="row-start-1 rounded-md border border-green dark:border-pink-neon px-4 py-4 sm:px-6 lg:row-start-auto lg:border-0 lg:px-0 lg:pb-16">
      <div className="mx-auto max-w-lg lg:max-w-none">
        <h2 className="text-lg font-['DejaVuSansMonoBold']">Order summary</h2>
        <ul role="list" className="divide-y">
          {summary.items.map((item) => (
            <li key={item.id} className="flex items-start space-x-4 py-6">
              <img
                src={`${IMAGES_URL}${theme === 'light' ? item.image : item.imageDark}`}
                alt={item.name}
                className="h-20 w-20 flex-none rounded-md border border-green dark:border-pink-neon bg-green-light dark:bg-purple-dark object-scale-down object-center"
              />
              <div className="flex-auto space-y-1">
                <h3>{item.name}</h3>
                <p className="text-sm font-light">Qty: {item.quantity}</p>
                <p className="text-sm font-light">
                  Price per unit: {formatPrice(item.price)}
                </p>
              </div>
              <p className="flex-none text-base">
                {formatPrice(item.quantity * item.price)}
              </p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt>Subtotal</dt>
            <dd className="font-['DejaVuSansMonoBold']">
              {formatPrice(summary.totalAmount)}
            </dd>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <dt>Fees</dt>
            <dd className="text-sm">
              Fees will be calculated at the next step
            </dd>
          </div>
          <div className="flex items-center justify-between border-t pt-4">
            <dt>Estimated order total</dt>
            <dd className="font-['DejaVuSansMonoBold']">
              {formatPrice(summary.totalAmount)}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  )
}
