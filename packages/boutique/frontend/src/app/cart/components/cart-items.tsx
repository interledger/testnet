import { useCartStore } from '@/hooks/use-cart-store.ts'
import { CartItem } from './cart-item.tsx'
import { Link } from 'react-router-dom'

export const CartItems = () => {
  const { items } = useCartStore()

  if (items.length === 0) {
    return (
      <section className="text-center lg:col-span-12">
        <h1 className="text-lg text-green dark:text-white">
          No items in cart.
        </h1>
        <Link
          to="/products"
          className="mt-2 rounded-sm text-lg text-green hover:underline dark:text-pink-neon dark:hover:no-underline dark:hover:shadow-glow-link focus:outline-none focus:ring-2 focus:ring-green dark:focus:ring-green-neon"
        >
          Go back to products page
        </Link>
      </section>
    )
  }

  return (
    <section className="lg:col-span-8">
      <ul role="list" className="divide-y">
        {items.map((item) => (
          <CartItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  )
}
