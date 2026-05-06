import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SubscriptionDetails, subscriptionService } from '@/lib/api/subscriptions'
import { useToast } from '@/lib/hooks/useToast'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Button } from '@/ui/Button'
import { Link } from '@/ui/Link'
import { Table } from '@/ui/Table'
import { formatDate, replaceWalletAddressProtocol } from '@/utils/helpers'
import { getSubscriptionIntervalDisplay } from '@/utils/subscriptionInterval'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { userService } from '@/lib/api/user'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { z } from 'zod'

type SubscriptionDetailsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

type SubscriptionDetailsServerProps = {
  details: SubscriptionDetails
  user: {
    isCardsVisible: boolean
  }
}

const SubscriptionDetailsPage: NextPageWithLayout<SubscriptionDetailsPageProps> = ({
  details
}) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isRetrying, setIsRetrying] = useState(false)
  const [isReauthorizing, setIsReauthorizing] = useState(false)
  const subscription = details.subscription
  const intervalDisplay = getSubscriptionIntervalDisplay({
    grantInterval: subscription.grantInterval,
    billingInterval: subscription.product.billingInterval,
    billingIntervalCount: subscription.product.billingIntervalCount
  })
  const canRetryPayment = subscription.status === 'PAST_DUE'
  const completedInstallmentCount = new Set(
    details.paymentHistory
      .filter((item) => item.paymentStatus === 'COMPLETED')
      .map((item) => item.paymentNumber)
      .filter((item): item is number => typeof item === 'number')
  ).size
  const isInstallmentPlan = typeof subscription.totalPayments === 'number'
  const nextInstallmentNumber = isInstallmentPlan
    ? Math.min(completedInstallmentCount + 1, subscription.totalPayments ?? 1)
    : undefined

  const formatSubscriptionAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  const handleRetryPayment = async () => {
    setIsRetrying(true)

    const response = await subscriptionService.retry(subscription.id)

    if (response.success) {
      toast({
        title: 'Payment retry started.',
        description: 'The subscription payment is being retried now.'
      })

      await router.replace(router.asPath)
      setIsRetrying(false)
      return
    }

    toast({
      title: 'Unable to retry payment.',
      description: response.message,
      variant: 'error'
    })
    setIsRetrying(false)
  }

  const handleReauthorize = async () => {
    setIsReauthorizing(true)

    const response = await subscriptionService.reauthorize(subscription.id)

    if (response.success && response.result?.redirectUrl) {
      window.location.assign(response.result.redirectUrl)
      return
    }

    toast({
      title: 'Unable to start re-authorization.',
      description: response.message,
      variant: 'error'
    })
    setIsReauthorizing(false)
  }

  return (
    <div className="flex flex-col items-start justify-start space-y-8 lg:max-w-xl xl:max-w-5xl">
      <div className="flex w-full items-center justify-between gap-4">
        <PageHeader title="Subscription details" />
        <Link href="/subscriptions" className="hidden md:inline-flex">
          Back to subscriptions
        </Link>
      </div>

      <div className="w-full rounded-lg border border-green dark:border-pink-neon p-5">
        <div className="mb-3 text-xl font-semibold">{subscription.product.name}</div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          <div>
            <span className="font-semibold">Wallet: </span>
            <span>{replaceWalletAddressProtocol(subscription.walletAddress)}</span>
          </div>
          <div>
            <span className="font-semibold">Status: </span>
            <Badge
              className="ml-2"
              intent={getStatusBadgeIntent(subscription.status)}
              size="md"
              text={subscription.status}
            />
          </div>
          <div>
            <span className="font-semibold">Interval: </span>
            <span>{intervalDisplay.label}</span>
            {intervalDisplay.startsAt ? (
              <span className="block text-sm text-gray-600 dark:text-gray-300">
                Starts {formatDate({ date: intervalDisplay.startsAt, time: true })}
              </span>
            ) : null}
          </div>
          <div>
            <span className="font-semibold">Amount: </span>
            <span>
              {formatSubscriptionAmount(subscription.amount, subscription.currency)}
            </span>
          </div>
          {isInstallmentPlan ? (
            <>
              <div>
                <span className="font-semibold">Installments: </span>
                <span>
                  {completedInstallmentCount} of {subscription.totalPayments}
                </span>
              </div>
              <div>
                <span className="font-semibold">
                  {subscription.nextBillingAt ? 'Next payment: ' : 'Last payment: '}
                </span>
                <span>
                  {subscription.nextBillingAt
                    ? nextInstallmentNumber
                    : completedInstallmentCount}{' '}
                  of {subscription.totalPayments}
                </span>
              </div>
            </>
          ) : null}
          <div className="md:col-span-2">
            <span className="font-semibold">Grant schedule: </span>
            <span className="break-all">{subscription.grantInterval ?? '-'}</span>
          </div>
          <div>
            <span className="font-semibold">Next billing: </span>
            <span>
              {subscription.nextBillingAt
                ? formatDate({ date: subscription.nextBillingAt })
                : '-'}
            </span>
          </div>
          <div>
            <span className="font-semibold">Created: </span>
            <span>{formatDate({ date: subscription.createdAt })}</span>
          </div>
          <div>
            <span className="font-semibold">Retries: </span>
            <span>{subscription.retryCount}</span>
          </div>
        </div>

        {canRetryPayment ? (
          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              intent="outline"
              aria-label="retry subscription payment"
              loading={isRetrying}
              disabled={isRetrying || isReauthorizing}
              onClick={handleRetryPayment}
            >
              Retry payment
            </Button>
            <Button
              aria-label="re-authorize subscription payments"
              loading={isReauthorizing}
              disabled={isRetrying || isReauthorizing}
              onClick={handleReauthorize}
            >
              Re-authorize payments
            </Button>
          </div>
        ) : null}
      </div>

      <div className="w-full">
        <h2 className="mb-3 text-2xl font-bold">Payment history</h2>
        <Table>
          <Table.Head
            columns={['Order', 'Date', 'Amount', 'Order status', 'Payment status']}
          />
          <Table.Body>
            {details.paymentHistory.length ? (
              details.paymentHistory.map((item) => (
                <Table.Row key={item.orderId}>
                  <Table.Cell className="whitespace-nowrap">
                    {item.paymentNumber && item.totalPayments ? (
                      <div className="flex flex-col">
                        <span>
                          Payment {item.paymentNumber} of {item.totalPayments}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {item.orderId}
                        </span>
                      </div>
                    ) : (
                      item.orderId
                    )}
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    {formatDate({ date: item.createdAt })}
                  </Table.Cell>
                  <Table.Cell>
                    {formatSubscriptionAmount(item.amount, subscription.currency)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      intent={getStatusBadgeIntent(item.orderStatus)}
                      size="md"
                      text={item.orderStatus}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {item.paymentStatus ? (
                      <Badge
                        intent={getStatusBadgeIntent(item.paymentStatus)}
                        size="md"
                        text={item.paymentStatus}
                      />
                    ) : (
                      '-'
                    )}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={5} className="text-center">
                  No payments yet.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

const querySchema = z.object({
  subscriptionId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  details: SubscriptionDetailsServerProps['details']
  user: SubscriptionDetailsServerProps['user']
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [detailsResponse, user] = await Promise.all([
    subscriptionService.getById(result.data.subscriptionId, ctx.req.headers.cookie),
    userService.me(ctx.req.headers.cookie)
  ])

  if (!detailsResponse.success || !detailsResponse.result || !user.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      details: detailsResponse.result,
      user: {
        isCardsVisible: user.result?.isCardsVisible ?? false
      }
    }
  }
}

SubscriptionDetailsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default SubscriptionDetailsPage
