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
import { formatAmount, formatDate } from '@/utils/helpers'
import { useRedirect } from '@/lib/hooks/useRedirect'
import { Button } from '@/ui/Button'

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
  { label: 'Incoming', value: 'INCOMING' },
  { label: 'Outgoing', value: 'OUTGOING' }
]

const statuses = [
  defaultOption,
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Expired', value: 'EXPIRED' }
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
  const [transactions, filters, pagination, fetch, loading, error] =
    useTransactions()

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

  const totalPages = useMemo<number>(
    () => Math.ceil(transactions.total / 10),
    [transactions.total]
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
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-5xl">
      <PageHeader title="Transactions" />
      <div className="grid w-full grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
        <div className="md:col-span-3">
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
                  redirect({
                    accountId: option.value,
                    paymentPointerId: '',
                    page: '0'
                  })
                } else {
                  redirect({ accountId: option.value, page: '0' })
                }
              }
            }}
          />
        </div>
        <div className="md:col-span-3">
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
              if (option) {
                if (
                  currentAccount.value &&
                  option.accountId !== currentAccount.value
                ) {
                  redirect({ paymentPointerId: '' })
                } else {
                  redirect({ paymentPointerId: option.value })
                }
              }
            }}
          />
        </div>
        <div className="md:col-span-3 lg:col-span-2">
          <Select
            options={types}
            label="Type"
            placeholder="Select type..."
            value={currentType}
            onChange={(option) => {
              if (option) {
                redirect({ type: option.value, page: '0' })
              }
            }}
          />
        </div>
        <div className="md:col-span-3 lg:col-span-2">
          <Select
            options={statuses}
            label="Status"
            placeholder="Select status..."
            value={currentStatus}
            onChange={(option) => {
              if (option) {
                redirect({ status: option.value, page: '0' })
              }
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="flex w-full flex-col items-center justify-center">
          <p className="text-lg">{error}</p>
          <Button
            aria-label="refresh transactions table"
            intent="secondary"
            onClick={() => fetch(filters, pagination)}
          >
            Refresh table
          </Button>
        </div>
      ) : loading ? (
        <Table.Shimmer />
      ) : (
        <div className="w-full" id="transactionsList">
          <Table>
            <Table.Head
              columns={[
                '',
                'Account',
                'Payment pointer',
                'Description',
                'Amount',
                'Status',
                'Date'
              ]}
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
                    <Table.Cell>{trx.accountName}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {trx.paymentPointerPublicName ??
                        trx.paymentPointerUrl ??
                        ''}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {trx.description ? (
                        trx.description
                      ) : (
                        <p className="text-sm font-thin">No description</p>
                      )}
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
                    <Table.Cell>
                      <Badge
                        intent={getStatusBadgeIntent(trx.status)}
                        size="md"
                        text={trx.status}
                      />
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {formatDate(trx.createdAt)}
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
      )}
      {!error && !loading ? (
        <div className="flex w-full items-center justify-between">
          <Button
            className="disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500"
            aria-label="go to previous page"
            disabled={Number(pagination.page) - 1 < 0}
            onClick={() => {
              const previousPage = Number(pagination.page) - 1
              if (isNaN(previousPage) || previousPage < 0) return
              redirect({ page: previousPage.toString() })
            }}
          >
            Previous
          </Button>
          <Button
            className="disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500"
            aria-label="go to next page"
            disabled={Number(pagination.page) + 1 > totalPages - 1}
            onClick={() => {
              const nextPage = Number(pagination.page) + 1
              if (isNaN(nextPage) || nextPage > totalPages - 1) return
              redirect({ page: nextPage.toString() })
            }}
          >
            Next
          </Button>
        </div>
      ) : null}
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

  paymentPointersResponse.data.paymentPointers.concat(paymentPointersResponse.data.wmPaymentPointers).map((pp) =>
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
