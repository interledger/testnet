import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'
import { AnimatedText } from '@/components/animated-text.tsx'
import { Button, buttonVariants } from '@/components/ui/button.tsx'
import { useFinishCheckoutMutation } from '@/hooks/use-finish-checkout-mutation.ts'
import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { cn } from '@/lib/utils.ts'
import { VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { checkoutConfirmationSearchParamsSchema } from '../route-schemas.ts'
import { Loader } from '@/components/loader.tsx'
import { OrderStatus, useOrderQuery } from '@/hooks/use-order-query.ts'

function InstantBuy() {
  return (
    <div className="mt-28 flex flex-col items-center gap-y-5 text-green dark:text-green-neon">
      <AnimatedCheckMark />
      <AnimatedText text="Thank you for your order!" />
      <Button variant="default" aria-label="continue shopping" asChild>
        <Link to="/products">Continue shopping</Link>
      </Button>
    </div>
  )
}

function CheckoutConfirmation() {
  const [{ orderId, hash, interact_ref, result }] = useZodSearchParams(
    checkoutConfirmationSearchParamsSchema
  )
  const { data: orderResponse } = useOrderQuery(orderId)
  const { mutate, error } = useFinishCheckoutMutation(orderId)
  useEffect(() => {
    mutate({
      hash,
      interactRef: interact_ref,
      result
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!orderResponse) {
    return <Loader />
  }

  const order = orderResponse.result

  if (order.status !== OrderStatus.PROCESSING) {
    let color: string = ' text-green dark:text-green-neon'
    let text: string = 'Thank you for your order!'
    let variant: VariantProps<typeof buttonVariants>['variant'] = 'default'

    if (result === 'grant_rejected') {
      color = ' text-orange-dark dark:text-pink-neon'
      text = 'Payment successfully declined.'
      variant = 'secondary'
    }

    if (order.status === OrderStatus.FAILED) {
      color = ' text-orange-dark dark:text-pink-neon'
      text = 'Payment failed.'
      variant = 'secondary'
    }

    return (
      <div
        className={cn(
          'mt-36 flex min-h-full w-full flex-col items-center gap-y-5',
          color
        )}
      >
        <AnimatedCheckMark />
        <AnimatedText text={text} />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: 1.5 } }
          }}
        >
          <Button variant={variant} aria-label="continue shopping" asChild>
            <Link to="/products">Continue shopping</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return <Navigate to="/products" />
  }

  return <Loader />
}

export function Component() {
  const [searchParams] = useSearchParams()
  const instantBuy = searchParams.get('instantBuy')

  if (instantBuy === 'true') return <InstantBuy />

  return <CheckoutConfirmation />
}
