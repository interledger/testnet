import { Button } from '@/components/ui/button'
import { addToCart } from '@/lib/stores/cart-store'
import { useContext } from 'react'
import { ProductContext } from '../$slug.tsx'
import { useToast } from '@/hooks/use-toast.tsx'
import { useTokenStore } from '@/hooks/use-token-store.ts'
import { useInstantBuyMutation } from '@/hooks/use-instant-buy-mutation.ts'
import { resetToken, setToken } from '@/lib/stores/token-store.ts'
import { Navigate } from 'react-router-dom'

export const ProductCTA = () => {
  const { accessToken, manageUrl, walletAddressUrl } = useTokenStore()
  const { product } = useContext(ProductContext)
  const { toast } = useToast()

  const { mutate, data, isPending } = useInstantBuyMutation({
    onError: function ({ message }) {
      if (message.match(/spending limit exceeded/)) {
        toast({
          title: 'Spending limit exceeded.',
          description: <p>{message}</p>,
          variant: 'error'
        })
        resetToken()
      }
    }
  })

  if (data?.result.accessToken) {
    setToken(data.result)
    return (
      <Navigate to="/checkout/confirmation?instantBuy=true" replace={true} />
    )
  }

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
    <div className="mt-10 flex gap-x-5">
      <Button
        disabled={isPending}
        aria-label="add to cart"
        onClick={() => handleClick()}
      >
        Add to cart
      </Button>
      {accessToken ? (
        <Button
          disabled={isPending}
          variant="secondary"
          aria-label="add to cart"
          onClick={() =>
            mutate({
              accessToken,
              manageUrl,
              walletAddressUrl,
              products: [
                {
                  productId: product.id,
                  quantity: 1
                }
              ]
            })
          }
        >
          Instant buy
        </Button>
      ) : null}
    </div>
  )
}
