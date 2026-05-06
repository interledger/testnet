import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { subscriptionService } from '@/lib/api/subscriptions'
import { NextPageWithLayout } from '@/lib/types/app'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { z } from 'zod'

const querySchema = z.object({
  result: z.enum(['grant_rejected', 'grant_invalid']).optional(),
  hash: z.string().optional(),
  interact_ref: z.string().uuid().optional(),
  subscriptionId: z.string().uuid()
})

type ConfirmationState = 'loading' | 'success' | 'canceled' | 'error'

const SubscriptionReauthorizationConfirmationPage: NextPageWithLayout = () => {
  const router = useRouter()
  const hasSubmittedRef = useRef(false)
  const [state, setState] = useState<ConfirmationState>('loading')
  const [message, setMessage] = useState('Finishing subscription re-authorization...')
  const [subscriptionId, setSubscriptionId] = useState<string>()

  useEffect(() => {
    if (!router.isReady || hasSubmittedRef.current) {
      return
    }

    const parsedQuery = querySchema.safeParse(router.query)

    if (!parsedQuery.success) {
      setState('error')
      setMessage('Invalid subscription re-authorization callback.')
      return
    }

    hasSubmittedRef.current = true
    setSubscriptionId(parsedQuery.data.subscriptionId)

    void (async () => {
      const response = await subscriptionService.finishReauthorization(
        parsedQuery.data.subscriptionId,
        {
          result: parsedQuery.data.result,
          hash: parsedQuery.data.hash,
          interactRef: parsedQuery.data.interact_ref
        }
      )

      if (!response.success) {
        setState('error')
        setMessage(response.message)
        return
      }

      if (parsedQuery.data.result === 'grant_rejected') {
        setState('canceled')
        setMessage('Re-authorization was canceled. The subscription is still past due.')
        return
      }

      setState('success')
      setMessage(
        'Subscription authorization has been refreshed. Retry the payment to collect the outstanding charge.'
      )
    })()
  }, [router.isReady, router.query])

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-bold md:text-4xl">Subscription re-authorization</h1>
        <p className="leading-[1.39]">{message}</p>
      </div>

      {state === 'loading' ? (
        <div className="text-sm text-grey-dark dark:text-grey-light">Processing...</div>
      ) : null}

      {subscriptionId ? (
        <Button
          aria-label="return to subscription details"
          href={`/subscriptions/${subscriptionId}`}
        >
          Back to subscription
        </Button>
      ) : null}
    </div>
  )
}

SubscriptionReauthorizationConfirmationPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default SubscriptionReauthorizationConfirmationPage