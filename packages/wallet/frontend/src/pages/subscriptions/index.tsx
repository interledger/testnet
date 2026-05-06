import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { userService } from '@/lib/api/user'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Table } from '@/ui/Table'
import { formatDate, replaceWalletAddressProtocol } from '@/utils/helpers'
import { getSubscriptionIntervalDisplay } from '@/utils/subscriptionInterval'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import {
  SubscriptionRecord,
  subscriptionService
} from '@/lib/api/subscriptions'
import { useRouter } from 'next/router'

type SubscriptionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

type SubscriptionsPageServerProps = {
  subscriptions: SubscriptionRecord[]
  user: {
    isCardsVisible: boolean
  }
}

const SubscriptionsPage: NextPageWithLayout<SubscriptionsPageProps> = ({
  subscriptions
}) => {
  const router = useRouter()

  const formatSubscriptionAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  return (
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-5xl">
      <PageHeader
        title="Your subscriptions"
        message="View the subscriptions you pay for from your wallet addresses."
      />

      <div className="w-full" id="subscriptionsList">
        <Table>
          <Table.Head
            columns={['', 'Product', 'Amount', 'Interval', 'Status', 'Next billing']}
          />
          <Table.Body>
            {subscriptions.length ? (
              subscriptions.map((subscription) => {
                const intervalDisplay = getSubscriptionIntervalDisplay({
                  grantInterval: subscription.grantInterval,
                  billingInterval: subscription.product.billingInterval,
                  billingIntervalCount: subscription.product.billingIntervalCount
                })

                return (
                <Table.Row
                  key={subscription.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/subscriptions/${subscription.id}`)}
                >
                  <Table.Cell className="w-1">{''}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{subscription.product.name}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {replaceWalletAddressProtocol(subscription.walletAddress)}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {formatSubscriptionAmount(
                      subscription.amount,
                      subscription.currency
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{intervalDisplay.label}</span>
                      {intervalDisplay.startsAt ? (
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          Starts {formatDate({ date: intervalDisplay.startsAt, time: false })}
                        </span>
                      ) : null}
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      intent={getStatusBadgeIntent(subscription.status)}
                      size="md"
                      text={subscription.status}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {subscription.nextBillingAt
                      ? formatDate({ date: subscription.nextBillingAt })
                      : '-'}
                  </Table.Cell>
                </Table.Row>
                )
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center">
                  No subscriptions found.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<{
  subscriptions: SubscriptionsPageServerProps['subscriptions']
  user: SubscriptionsPageServerProps['user']
}> = async (ctx) => {
  const [subscriptionsResponse, user] = await Promise.all([
    subscriptionService.list(ctx.req.headers.cookie),
    userService.me(ctx.req.headers.cookie)
  ])

  if (!user.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      subscriptions: subscriptionsResponse.success
        ? subscriptionsResponse.result ?? []
        : [],
      user: {
        isCardsVisible: user.result?.isCardsVisible ?? false
      }
    }
  }
}

SubscriptionsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default SubscriptionsPage
