import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/stores/cart-store'
import { useContext } from 'react'
import { ProductContext } from '../$slug.tsx'

export const ProductCTA = () => {
  const { product } = useContext(ProductContext)

  return (
    <div className="mt-10">
      <Button
        aria-label="add to cart"
        className="h-12"
        size="lg"
        onClick={() => addToCart(product)}
      >
        Add to cart
      </Button>
    </div>
  )
}
