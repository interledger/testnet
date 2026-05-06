import { MerchantTabs } from '@/components/MerchantTabs'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import {
  MerchantSubscriptionDetails,
  subscriptionService
} from '@/lib/api/subscriptions'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Link } from '@/ui/Link'
import { Table } from '@/ui/Table'
import { formatDate, replaceWalletAddressProtocol } from '@/utils/helpers'
import { getSubscriptionIntervalDisplay } from '@/utils/subscriptionInterval'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { z } from 'zod'

type MerchantSubscriptionDetailsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

type MerchantSubscriptionDetailsServerProps = {
  details: MerchantSubscriptionDetails
  user: {
    isCardsVisible: boolean
  }
}

const MerchantSubscriptionDetailsPage: NextPageWithLayout<
  MerchantSubscriptionDetailsPageProps
> = ({ details }) => {
  const { subscription, paymentHistory } = details
  const intervalDisplay = getSubscriptionIntervalDisplay({
    grantInterval: subscription.grantInterval,
    billingInterval: subscription.product.billingInterval,
    billingIntervalCount: subscription.product.billingIntervalCount
  })

  const formatSubscriptionAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  const completedPayments = paymentHistory.filter(
    (payment) => payment.paymentStatus === 'COMPLETED'
  )
  const totalCollected = completedPayments.reduce(
    (sum, payment) => sum + payment.amount,
    0
  )
  const failedPayments = paymentHistory.filter(
    (payment) => payment.paymentStatus === 'FAILED'
  ).length
  const completedInstallmentCount = new Set(
    paymentHistory
      .filter((payment) => payment.paymentStatus === 'COMPLETED')
      .map((payment) => payment.paymentNumber)
      .filter((paymentNumber): paymentNumber is number => typeof paymentNumber === 'number')
  ).size
  const isInstallmentPlan = typeof subscription.totalPayments === 'number'
  const nextInstallmentNumber = isInstallmentPlan
    ? Math.min(completedInstallmentCount + 1, subscription.totalPayments ?? 1)
    : undefined

  const summaryItems = [
    {
      label: 'Subscription amount',
      value: formatSubscriptionAmount(subscription.amount, subscription.currency),
      helper: intervalDisplay.label
    },
    {
      label: 'Total collected',
      value: formatSubscriptionAmount(totalCollected, subscription.currency),
      helper: `${completedPayments.length} completed payments`
    },
    {
      label: 'Latest payment',
      value: details.latestPaymentStatus,
      helper: details.latestPaymentId
    },
    {
      label: 'Payment outcomes',
      value: `${paymentHistory.length} total`,
      helper: `${failedPayments} failed`
    },
    ...(isInstallmentPlan
      ? [
          {
            label: 'Installments',
            value: `${completedInstallmentCount} of ${subscription.totalPayments}`,
            helper: subscription.nextBillingAt
              ? `Next payment ${nextInstallmentNumber} of ${subscription.totalPayments}`
              : `Last payment ${completedInstallmentCount} of ${subscription.totalPayments}`
          }
        ]
      : [])
  ]

  return (
    <div className="flex flex-col items-start justify-start space-y-8 lg:max-w-xl xl:max-w-5xl">
      <div className="flex w-full items-center justify-between gap-4">
        <PageHeader
          title="Merchant subscription"
          message="Review totals and payment history for a billed subscription."
        />
        <Link href="/merchant/subscriptions" className="hidden md:inline-flex">
          Back to subscriptions
        </Link>
      </div>

      <MerchantTabs />

      <section className="grid w-full gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="w-full rounded-lg border border-green p-5 dark:border-pink-neon"
          >
            <p className="text-sm text-gray-600 dark:text-gray-300">{item.label}</p>
            <p className="mt-2 text-2xl font-bold">{item.value}</p>
            <p className="mt-2 break-all text-sm text-gray-600 dark:text-gray-300">
              {item.helper}
            </p>
          </div>
        ))}
      </section>

      <section className="w-full rounded-lg border border-green p-5 dark:border-pink-neon">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{subscription.product.name}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Created {formatDate({ date: subscription.createdAt })}
            </p>
          </div>
          <Badge
            intent={getStatusBadgeIntent(subscription.status)}
            size="md"
            text={subscription.status}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <p className="font-semibold">Buyer wallet</p>
            <p>{replaceWalletAddressProtocol(details.buyerWalletAddress)}</p>
          </div>
          <div>
            <p className="font-semibold">Merchant wallet</p>
            <p>{details.merchantPublicName ?? 'Wallet'}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {replaceWalletAddressProtocol(details.merchantWalletAddress)}
            </p>
          </div>
          <div>
            <p className="font-semibold">Billing interval</p>
            <p>{intervalDisplay.label}</p>
            {intervalDisplay.startsAt ? (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Starts {formatDate({ date: intervalDisplay.startsAt, time: false })}
              </p>
            ) : null}
          </div>
          <div>
            <p className="font-semibold">Next billing</p>
            <p>
              {subscription.nextBillingAt
                ? formatDate({ date: subscription.nextBillingAt })
                : '-'}
            </p>
          </div>
          <div>
            <p className="font-semibold">Current cycle amount</p>
            <p>{formatSubscriptionAmount(subscription.amount, subscription.currency)}</p>
          </div>
          <div>
            <p className="font-semibold">Retry count</p>
            <p>{subscription.retryCount}</p>
          </div>
        </div>
      </section>

      <section className="w-full">
        <h2 className="mb-3 text-2xl font-bold">Payment history</h2>
        <Table>
          <Table.Head
            columns={[
              'Order',
              'Date',
              'Amount',
              'Order status',
              'Payment status'
            ]}
          />
          <Table.Body>
            {paymentHistory.length ? (
              paymentHistory.map((item) => (
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
      </section>
    </div>
  )
}

const querySchema = z.object({
  subscriptionId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  details: MerchantSubscriptionDetailsServerProps['details']
  user: MerchantSubscriptionDetailsServerProps['user']
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [detailsResponse, user] = await Promise.all([
    subscriptionService.getMerchantById(
      result.data.subscriptionId,
      ctx.req.headers.cookie
    ),
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

MerchantSubscriptionDetailsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default MerchantSubscriptionDetailsPage