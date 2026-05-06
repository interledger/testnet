import { MerchantTabs } from '@/components/MerchantTabs'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import {
  MerchantOneTimeOrderRecord,
  subscriptionService
} from '@/lib/api/subscriptions'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Table } from '@/ui/Table'
import { formatDate, replaceWalletAddressProtocol } from '@/utils/helpers'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'

type MerchantOrdersPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

type MerchantOrdersPageServerProps = {
  orders: MerchantOneTimeOrderRecord[]
  user: {
    isCardsVisible: boolean
  }
}

const MerchantOrdersPage: NextPageWithLayout<MerchantOrdersPageProps> = ({
  orders
}) => {
  const formatOrderAmount = (amount: number, currency: string) => {
    return `${amount.toFixed(2)} ${currency}`
  }

  const getProductsLabel = (productNames: string[]) => {
    if (productNames.length <= 1) {
      return productNames[0] ?? '-'
    }

    return `${productNames[0]} +${productNames.length - 1} more`
  }

  return (
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-5xl">
      <PageHeader
        title="Merchant"
        message="View one-time purchases paid into your merchant wallet addresses."
      />

      <MerchantTabs />

      <div className="w-full" id="merchantOrdersList">
        <Table>
          <Table.Head
            columns={[
              'Order',
              'Products',
              'Buyer',
              'Merchant wallet',
              'Amount',
              'Order status',
              'Payment status',
              'Created'
            ]}
          />
          <Table.Body>
            {orders.length ? (
              orders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>{order.id}</Table.Cell>
                  <Table.Cell>{getProductsLabel(order.productNames)}</Table.Cell>
                  <Table.Cell>
                    {replaceWalletAddressProtocol(order.buyerWalletAddress)}
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex flex-col">
                      <span>{order.merchantPublicName ?? 'Wallet'}</span>
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {replaceWalletAddressProtocol(order.merchantWalletAddress)}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    {formatOrderAmount(order.amount, order.currency)}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      intent={getStatusBadgeIntent(order.orderStatus)}
                      size="md"
                      text={order.orderStatus}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {order.paymentStatus ? (
                      <Badge
                        intent={getStatusBadgeIntent(order.paymentStatus)}
                        size="md"
                        text={order.paymentStatus}
                      />
                    ) : (
                      '-'
                    )}
                  </Table.Cell>
                  <Table.Cell>{formatDate({ date: order.createdAt })}</Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={8} className="text-center">
                  No merchant one-time orders found.
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
  orders: MerchantOrdersPageServerProps['orders']
  user: MerchantOrdersPageServerProps['user']
}> = async (ctx) => {
  const [ordersResponse, user] = await Promise.all([
    subscriptionService.listMerchantOneTimeOrders(ctx.req.headers.cookie),
    userService.me(ctx.req.headers.cookie)
  ])

  if (!user.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      orders: ordersResponse.success ? ordersResponse.result ?? [] : [],
      user: {
        isCardsVisible: user.result?.isCardsVisible ?? false
      }
    }
  }
}

MerchantOrdersPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default MerchantOrdersPage