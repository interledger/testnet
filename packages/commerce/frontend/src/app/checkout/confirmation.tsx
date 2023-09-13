import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'
import { AnimatedText } from '@/components/animated-text.tsx'
import { Button } from '@/components/ui/button.tsx'
import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { checkoutConfirmationSearchParamsSchema } from '../route-schemas.ts'
import { useFinishCheckoutMutation } from '@/hooks/use-finish-checkout-mutation.ts'
import { useEffect } from 'react'

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
    return (
      <div className="mt-36 flex min-h-full w-full flex-col items-center gap-y-5">
        <AnimatedCheckMark />
        <AnimatedText text="THANK YOU FOR YOUR ORDER!" />
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { delay: 1.5 } }
          }}
        >
          <Button variant="secondary" aria-label="continue shopping" asChild>
            <Link to="/products">Continue shopping</Link>
          </Button>
        </motion.div>
      </div>
    )
  }

  if (error) {
    return <>{error.message}</>
  }

  return <>Loading...</>
}
