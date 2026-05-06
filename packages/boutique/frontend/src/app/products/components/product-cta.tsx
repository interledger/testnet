import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input.tsx'
import { addToCart } from '@/lib/stores/cart-store'
import { useContext, useState } from 'react'
import { ProductContext } from '../$slug.tsx'
import { useToast } from '@/hooks/use-toast.tsx'
import { useTokenStore } from '@/hooks/use-token-store.ts'
import { useInstantBuyMutation } from '@/hooks/use-instant-buy-mutation.ts'
import { resetToken, setToken } from '@/lib/stores/token-store.ts'
import { Navigate } from 'react-router-dom'
import { useCreateSubscriptionMutation } from '@/hooks/use-create-subscription-mutation.ts'
import { ProductType } from '@/hooks/use-products-query.ts'

export const ProductCTA = () => {
  const { accessToken, manageUrl, walletAddressUrl } = useTokenStore()
  const { product } = useContext(ProductContext)
  const { toast } = useToast()
  const [subscriptionWalletAddress, setSubscriptionWalletAddress] = useState('')

  const {
    mutate: subscribe,
    data: subscriptionData,
    isPending: isSubscribePending
  } = useCreateSubscriptionMutation({
    onError: function ({ message }) {
      toast({
        title: 'Subscription setup failed.',
        description: <p>{message}</p>,
        variant: 'error'
      })
    }
  })

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

  if (subscriptionData?.result.redirectUrl) {
    window.location.href = subscriptionData.result.redirectUrl
    return null
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

  if (product.productType === ProductType.SUBSCRIPTION) {
    return (
      <div className="mt-10 flex flex-col gap-y-4">
        <Input
          aria-label="subscription wallet address"
          placeholder="Wallet address"
          value={subscriptionWalletAddress}
          onChange={(e) => setSubscriptionWalletAddress(e.target.value)}
        />
        <Button
          disabled={isSubscribePending || subscriptionWalletAddress.length === 0}
          aria-label="subscribe"
          onClick={() =>
            subscribe({
              walletAddressUrl: subscriptionWalletAddress,
              productId: product.id
            })
          }
        >
          Subscribe
        </Button>
      </div>
    )
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
