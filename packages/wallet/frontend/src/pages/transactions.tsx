import { PageHeader } from '@/components/PageHeader'
import { useCallback, useEffect, useMemo } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { NextPageWithLayout } from '@/lib/types/app'
import { AppLayout } from '@/components/layouts/AppLayout'
import { accountService } from '@/lib/api/account'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { Select, SelectOption } from '@/ui/forms/Select'
import { useRouter } from 'next/router'
import { useTransactions } from '@/lib/hooks/useTransactions'
import { Table } from '@/ui/Table'
import { Arrow } from '@/components/icons/Arrow'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'

type PaymentPointerSelectOption = SelectOption & {
  accountId: string
}

export type TransactionsFilterProps = {
  accounts: SelectOption[]
  paymentPointers: PaymentPointerSelectOption[]
}

type QueryParameters = Record<string, string>

type Filters = {
  accountId: SelectOption
  paymentPointerId: SelectOption
  type: SelectOption
  status: SelectOption
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
  const router = useRouter()
  const [transactions, fetch, loading, error] = useTransactions()
  const { accountId, paymentPointerId, type, status } =
    router.query as QueryParameters

  const currentAccount = useMemo<SelectOption>(
    () =>
      accounts.find((account) => account.value === accountId) ?? defaultOption,
    [accounts, accountId]
  )
  const currentPaymentPointer = useMemo<PaymentPointerSelectOption>(
    () =>
      paymentPointers.find((pp) => pp.value === paymentPointerId) ?? {
        ...defaultOption,
        accountId: ''
      },
    [paymentPointers, paymentPointerId]
  )
  const currentType = useMemo<SelectOption>(
    () => types.find((t) => t.value === type) ?? defaultOption,
    [type]
  )
  const currentStatus = useMemo<SelectOption>(
    () => statuses.find((s) => s.value === status) ?? defaultOption,
    [status]
  )

  const redirect = useCallback(
    (filterKey: keyof Filters, option: string) => {
      const query = {
        ...router.query,
        [`${filterKey}`]: option
      }
      if (option === '') {
        delete query[filterKey]
      }
      router.push(
        {
          pathname: '/transactions',
          query
        },
        undefined,
        { shallow: true }
      )
    },
    [router]
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

  useEffect(() => {
    fetch({ accountId, paymentPointerId, type, status })
  }, [fetch, accountId, paymentPointerId, type, status])

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
              redirect('accountId', option.value)
            }
          }}
        />
        <Select
          options={paymentPointers}
          label="Payment Pointer"
          placeholder="Select payment pointer..."
          value={currentPaymentPointer}
          onChange={(option) => {
            if (option) {
              redirect('paymentPointerId', option.value)
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
              redirect('type', option.value)
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
              redirect('status', option.value)
            }
          }}
        />
        {loading ? 'Loading...' : null}
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
