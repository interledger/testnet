import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/stores/cart-store'
import { useContext } from 'react'
import { ProductContext } from '../$slug.tsx'
import { useToast } from '@/hooks/use-toast.tsx'

export const ProductCTA = () => {
  const { product } = useContext(ProductContext)
  const { toast } = useToast()

  function handleClick() {
    addToCart(product)
    toast({
      title: 'Item added to cart.',
      description: (
        <p>
          Product <span className="italic">{product.name}</span> was added to
          cart.
        </p>
      ),
      variant: 'success'
    })
  }

  return (
    <div className="mt-10">
      <Button
        aria-label="add to cart"
        className="h-12"
        size="lg"
        onClick={() => handleClick()}
      >
        Add to cart
      </Button>
    </div>
  )
}
