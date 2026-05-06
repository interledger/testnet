import { MerchantTabs } from '@/components/MerchantTabs'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import {
  MerchantSubscriptionRecord,
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

type MerchantSubscriptionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

type MerchantSubscriptionsPageServerProps = {
  subscriptions: MerchantSubscriptionRecord[]
  user: {
    isCardsVisible: boolean
  }
}

const MerchantSubscriptionsPage: NextPageWithLayout<
  MerchantSubscriptionsPageProps
> = ({ subscriptions }) => {
  const formatSubscriptionAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  return (
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-6xl">
      <PageHeader
        title="Merchant"
        message="View subscriptions billed into your merchant wallet addresses."
      />

      <MerchantTabs />

      <div className="w-full" id="merchantSubscriptionsList">
        <Table>
          <Table.Head
            columns={[
              'Product',
              'Buyer',
              'Merchant wallet',
              'Amount',
              'Interval',
              'Subscription status',
              'Latest payment',
              'Next billing',
              'Details'
            ]}
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
                <Table.Row key={subscription.id}>
                  <Table.Cell>{subscription.product.name}</Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>
                        {replaceWalletAddressProtocol(
                          subscription.buyerWalletAddress
                        )}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{subscription.merchantPublicName ?? 'Wallet'}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {replaceWalletAddressProtocol(
                          subscription.merchantWalletAddress
                        )}
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
                    <Badge
                      intent={getStatusBadgeIntent(
                        subscription.latestPaymentStatus
                      )}
                      size="md"
                      text={subscription.latestPaymentStatus}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {subscription.nextBillingAt
                      ? formatDate({ date: subscription.nextBillingAt })
                      : '-'}
                  </Table.Cell>
                  <Table.Cell>
                    <Link href={`/merchant/subscriptions/${subscription.id}`}>
                      View details
                    </Link>
                  </Table.Cell>
                </Table.Row>
                )
              })
            ) : (
              <Table.Row>
                <Table.Cell colSpan={9} className="text-center">
                  No merchant subscriptions found.
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
  subscriptions: MerchantSubscriptionsPageServerProps['subscriptions']
  user: MerchantSubscriptionsPageServerProps['user']
}> = async (ctx) => {
  const [subscriptionsResponse, user] = await Promise.all([
    subscriptionService.listMerchant(ctx.req.headers.cookie),
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

MerchantSubscriptionsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default MerchantSubscriptionsPage