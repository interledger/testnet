import { Arrow } from '@/components/icons/Arrow'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Account, accountService } from '@/lib/api/account'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Table } from '@/ui/Table'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatDate } from '@/utils/helpers'

type TransactionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  account,
  paymentPointer
}) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader
          title="Transactions"
          message={
            <span>
              Account: {account.name}
              <br />
              Payment Pointer: {paymentPointer.url}
            </span>
          }
        />
      </div>
      {/* TODO: Filters */}
      <div className="mt-10 flex w-full flex-col space-y-3 md:max-w-2xl">
        <Table>
          <Table.Head
            columns={['', 'Date', 'Description', 'Status', 'Amount']}
          />
          <Table.Body>
            {paymentPointer.transactions.length ? (
              paymentPointer.transactions.map((trx) => (
                <Table.Row key={trx.id}>
                  <Table.Cell className="w-10">
                    <Arrow
                      direction={trx.type === 'INCOMING' ? 'down' : 'up'}
                    />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    {formatDate(trx.createdAt)}
                  </Table.Cell>
                  <Table.Cell>{trx.description ?? 'No description'}</Table.Cell>
                  <Table.Cell>
                    <Badge
                      intent={getStatusBadgeIntent(trx.status)}
                      size="md"
                      text={trx.status}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    {trx.value} {trx.assetCode}
                  </Table.Cell>
                </Table.Row>
              ))
            ) : (
              <Table.Row>
                <Table.Cell colSpan={4} className="text-center">
                  No transactions found.
                </Table.Cell>
              </Table.Row>
            )}
          </Table.Body>
        </Table>
      </div>
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid(),
  paymentPointerId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  paymentPointer: PaymentPointer
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [accountResponse, paymentPointerResponse] = await Promise.all([
    accountService.get(result.data.accountId, ctx.req.headers.cookie),
    paymentPointerService.get(
      {
        accountId: result.data.accountId,
        paymentPointerId: result.data.paymentPointerId
      },
      ctx.req.headers.cookie
    )
  ])

  if (!accountResponse.success || !paymentPointerResponse.success) {
    return {
      notFound: true
    }
  }

  if (!accountResponse.data || !paymentPointerResponse.data) {
    return {
      notFound: true
    }
  }

  console.log(paymentPointerResponse.data)

  return {
    props: {
      account: accountResponse.data,
      paymentPointer: paymentPointerResponse.data
    }
  }
}

TransactionsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default TransactionsPage
