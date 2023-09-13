import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'
import { AnimatedText } from '@/components/animated-text.tsx'
import { Button, buttonVariants } from '@/components/ui/button.tsx'
import { useFinishCheckoutMutation } from '@/hooks/use-finish-checkout-mutation.ts'
import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { cn } from '@/lib/utils.ts'
import { VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { checkoutConfirmationSearchParamsSchema } from '../route-schemas.ts'
import { Loader } from './components/loader.tsx'

export function Component() {
  const [{ orderId, hash, interact_ref, result }] = useZodSearchParams(
    checkoutConfirmationSearchParamsSchema
  )
  const { mutate, data, error } = useFinishCheckoutMutation(orderId)

  useEffect(() => {
    mutate({
      hash,
      interactRef: interact_ref,
      result
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (data) {
    let color: string = 'text-turqoise'
    let text: string | undefined = 'Thank you for your order!'
    let variant: VariantProps<typeof buttonVariants>['variant'] = 'default'

    if (result === 'grant_rejected') {
      color = 'text-pink'
      text = 'Payment successfully declined.'
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
    return <>{error.message}</>
  }

  return <Loader />
}
