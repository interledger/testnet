import { useCartStore } from '@/hooks/use-cart-store.ts'
import { CartItem } from './cart-item.tsx'

export const CartItems = () => {
  const { items } = useCartStore()

  return (
    <section className="lg:col-span-7">
      <ul role="list" className="divide-y divide-green-3">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}
