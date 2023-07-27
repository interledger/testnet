import { PageHeader } from '@/components/PageHeader'
import { useEffect, useMemo } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { NextPageWithLayout } from '@/lib/types/app'
import { AppLayout } from '@/components/layouts/AppLayout'
import { accountService } from '@/lib/api/account'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { Select, SelectOption } from '@/ui/forms/Select'
import {
  TransactionsFilters,
  useTransactions
} from '@/lib/hooks/useTransactions'
import { Table } from '@/ui/Table'
import { Arrow } from '@/components/icons/Arrow'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { formatAmount } from '@/utils/helpers'
import { useRedirect } from '@/lib/hooks/useRedirect'

type PaymentPointerSelectOption = SelectOption & {
  accountId: string
}

export type TransactionsFilterProps = {
  accounts: SelectOption[]
  paymentPointers: PaymentPointerSelectOption[]
}

const defaultOption = {
  label: 'All',
  value: ''
}

const types: SelectOption[] = [
  defaultOption,
  {
    label: 'Incoming',
    value: 'INCOMING'
  },
  { label: 'Outgoing', value: 'OUTGOING' }
]

const statuses = [
  defaultOption,
  {
    label: 'Completed',
    value: 'COMPLETED'
  },
  { label: 'Pending', value: 'PENDING' }
]

type TransactionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  accounts,
  paymentPointers
}) => {
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const redirect = useRedirect<TransactionsFilters>()
  const [transactions, filters, pagination, fetch, loading] = useTransactions()

  const currentAccount = useMemo<SelectOption>(
    () =>
      accounts.find((account) => account.value === filters.accountId) ??
      defaultOption,
    [accounts, filters.accountId]
  )
  const currentPaymentPointer = useMemo<PaymentPointerSelectOption>(
    () =>
      paymentPointers.find((pp) => pp.value === filters.paymentPointerId) ?? {
        ...defaultOption,
        accountId: ''
      },
    [paymentPointers, filters.paymentPointerId]
  )
  const currentType = useMemo<SelectOption>(
    () => types.find((t) => t.value === filters.type) ?? defaultOption,
    [filters.type]
  )
  const currentStatus = useMemo<SelectOption>(
    () => statuses.find((s) => s.value === filters.status) ?? defaultOption,
    [filters.status]
  )

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
    <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
      <PageHeader title="Transactions" />
      <div className="mt-5 flex w-full flex-col space-y-5 lg:max-w-xl xl:max-w-4xl">
        <Select
          options={accounts}
          label="Account"
          placeholder="Select account..."
          value={currentAccount}
          onChange={(option) => {
            if (option) {
              if (
                option.value &&
                option.value !== currentPaymentPointer.value
              ) {
                redirect({ accountId: option.value, paymentPointerId: '' })
              } else {
                redirect({ accountId: option.value })
              }
            }
          }}
        />
        <Select
          options={
            currentAccount.value === ''
              ? paymentPointers
              : paymentPointers.filter(
                  (pp) => pp.accountId === currentAccount.value
                )
          }
          label="Payment Pointer"
          placeholder="Select payment pointer..."
          value={
            currentPaymentPointer.accountId !== currentAccount.value &&
            currentAccount.value !== ''
              ? { ...defaultOption, accountId: '' }
              : currentPaymentPointer
          }
          onChange={(option) => {
            console.log(
              currentAccount.value &&
                currentPaymentPointer.accountId !== currentAccount.value
            )
            if (option) {
              if (
                currentAccount.value &&
                currentPaymentPointer.accountId !== currentAccount.value
              ) {
                console.log('aici')
                redirect({ paymentPointerId: '' })
              } else {
                redirect({ paymentPointerId: option.value })
              }
            }
          }}
        />
        <Select
          options={types}
          label="Type"
          placeholder="Select type..."
          value={currentType}
          onChange={(option) => {
            if (option) {
              redirect({ type: option.value })
            }
          }}
        />
        <Select
          options={statuses}
          label="Status"
          placeholder="Select status..."
          value={currentStatus}
          onChange={(option) => {
            if (option) {
              redirect({ status: option.value })
            }
          }}
        />
        {loading ? (
          <Table.Shimmer />
        ) : (
          <Table>
            <Table.Head
              columns={['', 'Date', 'Description', 'Status', 'Amount']}
            />
            <Table.Body>
              {transactions.results.length ? (
                transactions.results.map((trx) => (
                  <Table.Row key={trx.id}>
                    <Table.Cell className="w-10">
                      <Arrow
                        direction={trx.type === 'INCOMING' ? 'down' : 'up'}
                      />
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {trx.createdAt}
                    </Table.Cell>
                    <Table.Cell>
                      {trx.description ?? 'No description'}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        intent={getStatusBadgeIntent(trx.status)}
                        size="md"
                        text={trx.status}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      {
                        formatAmount({
                          value: trx.value ?? 0,

                          assetCode: trx.assetCode,

                          assetScale: trx.assetScale
                        }).amount
                      }
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
        )}
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<
  TransactionsFilterProps
> = async (ctx) => {
  const [accountsResponse, paymentPointersResponse] = await Promise.all([
    accountService.list(ctx.req.headers.cookie),
    paymentPointerService.listAll(ctx.req.headers.cookie)
  ])

  if (
    !accountsResponse.success ||
    !paymentPointersResponse.success ||
    !paymentPointersResponse.data ||
    !accountsResponse.data
  ) {
    return {
      notFound: true
    }
  }

  const accounts = [{ label: 'All', value: '' }]
  const paymentPointers = [{ label: 'All', value: '', accountId: '' }]

  accountsResponse.data.map((account) =>
    accounts.push({
      label: account.name,
      value: account.id
    })
  )

  paymentPointersResponse.data.map((pp) =>
    paymentPointers.push({
      label: pp.url,
      value: pp.id,
      accountId: pp.accountId
    })
  )

  return {
    props: {
      accounts,
      paymentPointers
    }
  }
}

TransactionsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default TransactionsPage
