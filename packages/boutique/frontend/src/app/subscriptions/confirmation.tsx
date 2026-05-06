import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'
import { AnimatedText } from '@/components/animated-text.tsx'
import { Button } from '@/components/ui/button.tsx'
import { Loader } from '@/components/loader.tsx'
import {
  SubscriptionStatus,
  useFinishSubscriptionMutation
} from '@/hooks/use-finish-subscription-mutation.ts'
import { useZodSearchParams } from '@/hooks/use-zod-search-params.ts'
import { cn } from '@/lib/utils.ts'
import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { subscriptionConfirmationSearchParamsSchema } from '../route-schemas.ts'

export function Component() {
  const [{ subscriptionId, hash, interact_ref, result }] = useZodSearchParams(
    subscriptionConfirmationSearchParamsSchema
  )

  const { mutate, data, error } = useFinishSubscriptionMutation(subscriptionId)

  useEffect(() => {
    mutate({
      hash,
      interactRef: interact_ref,
      result
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return <Navigate to="/products" replace />
  }

  if (!data) {
    return <Loader />
  }

  const status = data.result.status
  let text = 'Subscription activated successfully!'
  let color = 'text-green dark:text-green-neon'

  if (status === SubscriptionStatus.CANCELED || result === 'grant_rejected') {
    text = 'Subscription setup was canceled.'
    color = 'text-orange-dark dark:text-pink-neon'
  }

  if (status === SubscriptionStatus.PAST_DUE) {
    text = 'Subscription created, but first payment needs attention.'
    color = 'text-orange-dark dark:text-pink-neon'
  }

  return (
    <div
      className={cn('mt-36 flex min-h-full w-full flex-col items-center gap-y-5', color)}
    >
      <AnimatedCheckMark />
      <AnimatedText text={text} />
      <Button variant="default" aria-label="continue shopping" asChild>
        <Link to="/products">Continue shopping</Link>
      </Button>
    </div>
  )
}
