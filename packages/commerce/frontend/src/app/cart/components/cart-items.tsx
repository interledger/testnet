import { useCartStore } from '@/hooks/use-cart-store.ts'
import { CartItem } from './cart-item.tsx'
import { Link } from 'react-router-dom'

export const CartItems = () => {
  const { items } = useCartStore()

  if (items.length === 0) {
    return (
      <section className="text-center lg:col-span-12">
        <h1 className="text-lg">No items in cart.</h1>
        <Link
          to="/products"
          className="mt-2 rounded-sm text-lg text-green-6 hover:text-green-3 focus:outline-none focus:ring-2 focus:ring-green-3"
        >
          Go back to products page
        </Link>
      </section>
    )
  }

  return (
    <section className="lg:col-span-8">
      <ul role="list" className="divide-y divide-green-3">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}
