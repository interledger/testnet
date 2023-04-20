import { Arrow } from '@/components/icons/Arrow'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Account, accountService } from '@/lib/api/account'
import {
  PaymentPointer,
  paymentPointerService,
  TransactionWithFormattedValue
} from '@/lib/api/paymentPointer'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Table } from '@/ui/Table'
import { formatAmount } from '@/utils/helpers'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'

type TransactionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

export default function TransactionsPage({
  account,
  paymentPointer,
  transactions
}: TransactionsPageProps) {
  return (
    <AppLayout>
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
            {transactions.length ? (
              transactions.map((trx) => (
                <Table.Row key={trx.id}>
                  <Table.Cell className="w-10">
                    {/*
                      Having only an arrow that describes the transaction type
                      can be confusig. 
                      TODO: Find a better way to display to display transaction type.
                    */}
                    <Arrow
                      className="h-4 w-4"
                      direction={trx.type === 'INCOMING' ? 'right' : 'left'}
                    />
                  </Table.Cell>
                  <Table.Cell className="whitespace-nowrap">
                    {trx.createdAt}
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
    </AppLayout>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid(),
  paymentPointerId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  paymentPointer: PaymentPointer
  transactions: TransactionWithFormattedValue[]
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [accountResponse, paymentPointerResponse, transactionsResponse] =
    await Promise.all([
      accountService.get(result.data.accountId, ctx.req.headers.cookie),
      paymentPointerService.get(
        result.data.accountId,
        result.data.paymentPointerId,
        ctx.req.headers.cookie
      ),
      paymentPointerService.getTransactions(
        result.data.accountId,
        result.data.paymentPointerId,
        ctx.req.headers.cookie
      )
    ])

  if (
    !accountResponse.success ||
    !paymentPointerResponse.success ||
    !transactionsResponse.success
  ) {
    return {
      notFound: true
    }
  }

  if (
    !accountResponse.data ||
    !paymentPointerResponse.data ||
    !transactionsResponse.data
  ) {
    return {
      notFound: true
    }
  }

  const transactions = transactionsResponse.data.map((trx) => ({
    ...trx,
    createdAt: new Date(trx.createdAt).toLocaleDateString('default', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    value: formatAmount(trx.value)
  }))

  return {
    props: {
      account: accountResponse.data,
      paymentPointer: paymentPointerResponse.data,
      transactions
    }
  }
}
