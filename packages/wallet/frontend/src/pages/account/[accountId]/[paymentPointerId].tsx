import { Arrow } from '@/components/icons/Arrow'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Account, accountService } from '@/lib/api/account'
import {
  PaymentPointer,
  Transaction,
  paymentPointerService
} from '@/lib/api/paymentPointer'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { Table } from '@/ui/Table'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatAmount, formatDate } from '@/utils/helpers'
import { useEffect } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'

type TransactionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  account,
  paymentPointer,
  transactions
}) => {
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isUserFirstTime) {
      setTimeout(() => {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      <div
        className="mt-10 flex w-full flex-col space-y-3 md:max-w-2xl"
        id="transactionsList"
      >
        <Table>
          <Table.Head
            columns={['', 'Date', 'Description', 'Status', 'Amount']}
          />
          <Table.Body>
            {transactions.length ? (
              transactions.map((trx) => (
                <Table.Row key={trx.id}>
                  <Table.Cell className="w-10">
                    <Arrow
                      direction={trx.type === 'INCOMING' ? 'down' : 'up'}
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
                  <Table.Cell>{trx.value}</Table.Cell>
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
  transactions: Transaction[]
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
        {
          accountId: result.data.accountId,
          paymentPointerId: result.data.paymentPointerId
        },
        ctx.req.headers.cookie
      ),
      paymentPointerService.listTransactions(
        {
          accountId: result.data.accountId,
          paymentPointerId: result.data.paymentPointerId
        },
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

  const transactions = transactionsResponse.data?.map((trx) => ({
    ...trx,
    createdAt: formatDate(trx.createdAt),
    value: formatAmount({
      value: trx.value,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      assetCode: accountResponse.data!.assetCode,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      assetScale: accountResponse.data!.assetScale
    }).amount
  }))

  return {
    props: {
      account: accountResponse.data,
      paymentPointer: paymentPointerResponse.data,
      transactions
    }
  }
}

TransactionsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default TransactionsPage
