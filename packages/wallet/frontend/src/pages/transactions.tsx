import { PageHeader } from '@/components/PageHeader'
import { useEffect, useMemo } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { NextPageWithLayout } from '@/lib/types/app'
import { AppLayout } from '@/components/layouts/AppLayout'
import { accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { Select, SelectOption } from '@/ui/forms/Select'
import {
  TransactionsFilters,
  useTransactions
} from '@/lib/hooks/useTransactions'
import { Table } from '@/ui/Table'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { formatAmount, formatDate } from '@/utils/helpers'
import { useRedirect } from '@/lib/hooks/useRedirect'
import { Button } from '@/ui/Button'
import { cx } from 'class-variance-authority'
import { IconButton } from '@/ui/IconButton'
import { PlayDark, PlayLight } from '@/components/icons/Play'
import { Label } from '@/ui/forms/Label'
import { useTheme } from 'next-themes'

type WalletAddressSelectOption = SelectOption & {
  accountId: string
}

export type TransactionsFilterProps = {
  accounts: SelectOption[]
  walletAddresses: WalletAddressSelectOption[]
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

const statuses: SelectOption[] = [
  defaultOption,
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Expired', value: 'EXPIRED' }
]

const transactionsPerPage: SelectOption[] = [
  { label: '5', value: '5' },
  { label: '10', value: '10' },
  { label: '15', value: '15' },
  { label: '30', value: '30' },
  { label: '50', value: '50' },
  { label: '100', value: '100' }
]

type TransactionsPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const TransactionsPage: NextPageWithLayout<TransactionsPageProps> = ({
  accounts,
  walletAddresses
}) => {
  const theme = useTheme()
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const redirect = useRedirect<TransactionsFilters>({
    path: '/transactions',
    persistQuery: true
  })
  const [transactions, filters, pagination, fetch, loading, error] =
    useTransactions()

  const currentAccount = useMemo<SelectOption>(
    () =>
      accounts.find((account) => account.value === filters.accountId) ??
      defaultOption,
    [accounts, filters.accountId]
  )
  const currentWalletAddress = useMemo<WalletAddressSelectOption>(
    () =>
      walletAddresses.find((pp) => pp.value === filters.walletAddressId) ?? {
        ...defaultOption,
        accountId: ''
      },
    [walletAddresses, filters.walletAddressId]
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
    () => Math.ceil(transactions.total / Number(pagination.pageSize)),
    [pagination.pageSize, transactions.total]
  )

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  useEffect(() => {
    if (isUserFirstTime) {
      setTimeout(() => {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const morePagesDisplay = (
    <>
      <div className="mx-1 mt-6 h-1 w-1 rounded-full bg-green-4 ring-1 ring-green-3" />
      <div className="mx-1 mt-6 h-1 w-1 rounded-full bg-green-4 ring-1 ring-green-3" />
      <div className="mx-1 mt-6 h-1 w-1 rounded-full bg-green-4 ring-1 ring-green-3" />
    </>
  )

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
                  option.value !== currentWalletAddress.value
                ) {
                  redirect({
                    accountId: option.value,
                    walletAddressId: '',
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
                ? walletAddresses
                : walletAddresses.filter(
                    (pp) => pp.accountId === currentAccount.value
                  )
            }
            label="Payment Pointer"
            placeholder="Select payment pointer..."
            value={
              currentWalletAddress.accountId !== currentAccount.value &&
              currentAccount.value !== ''
                ? { ...defaultOption, accountId: '' }
                : currentWalletAddress
            }
            onChange={(option) => {
              if (option) {
                if (
                  currentAccount.value &&
                  option.accountId !== currentAccount.value
                ) {
                  redirect({ walletAddressId: '' })
                } else {
                  redirect({ walletAddressId: option.value })
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
      <div className="flex w-full items-center justify-between xl:pr-10">
        <Button
          aria-label="clear filters"
          intent="outline"
          onClick={() =>
            redirect({
              accountId: '',
              walletAddressId: '',
              type: '',
              status: '',
              page: pagination.page,
              orderByDate: pagination.orderByDate
            })
          }
          className="mt-2"
        >
          Clear filters
        </Button>
        <div className="flex flex-col items-center justify-center gap-2 md:flex-row">
          <Label>Transactions/page</Label>
          <Select
            options={transactionsPerPage}
            className="w-20"
            value={{ label: pagination.pageSize, value: pagination.pageSize }}
            onChange={(option) => {
              redirect({ pageSize: option?.value, page: 0 })
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
                'Account',
                'Payment pointer name',
                'Description',
                'Amount',
                'Status',
                'Date'
              ]}
              sort={[
                {
                  header: 'Date',
                  sortFn: () => {
                    pagination.orderByDate === 'DESC'
                      ? redirect({ orderByDate: 'ASC' })
                      : redirect({ orderByDate: 'DESC' })
                  },
                  getDirection: () => {
                    return pagination.orderByDate === 'DESC' ? 'down' : 'up'
                  }
                }
              ]}
            />
            <Table.Body>
              {transactions.results.length ? (
                transactions.results.map((trx) => (
                  <Table.Row key={trx.id}>
                    <Table.Cell>{trx.accountName}</Table.Cell>
                    <Table.Cell className="has-tooltip cursor-pointer whitespace-nowrap">
                      {trx.walletAddressPublicName ??
                        trx.walletAddressUrl ??
                        ''}
                      {trx.walletAddressUrl ? (
                        <span className="tooltip -ml-10 -mt-11 rounded border border-turqoise bg-white p-2 text-base shadow-lg">
                          {trx.walletAddressUrl}
                        </span>
                      ) : null}
                    </Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {trx.description ? (
                        trx.description
                      ) : (
                        <p className="text-sm font-thin">No description</p>
                      )}
                    </Table.Cell>
                    <Table.Cell
                      className={cx(
                        trx.type === 'INCOMING' && 'text-green-3',
                        trx.type === 'OUTGOING' && 'text-pink-2'
                      )}
                    >
                      {trx.type === 'INCOMING' ? '+' : '-'}
                      {
                        formatAmount({
                          value: String(trx.value) ?? 0,
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
                      {formatDate({ date: trx.createdAt.toString() })}
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
        <>
          <div className="flex w-full items-center justify-between">
            <Button
              className="hidden disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500 md:flex"
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
            {totalPages !== 1 && (
              <div className="flex w-full justify-center">
                <IconButton
                  className="mx-3 md:hidden"
                  aria-label="go back"
                  onClick={() => {
                    const previousPage = Number(pagination.page) - 1
                    if (isNaN(previousPage) || previousPage < 0) return
                    redirect({ page: previousPage.toString() })
                  }}
                >
                  {theme.theme === 'dark' ? (
                    <PlayDark className="h-4 w-4 rotate-180" />
                  ) : (
                    <PlayLight className="h-4 w-4 rotate-180" />
                  )}
                </IconButton>
                {pages.map((page) => {
                  if (
                    Math.abs(page - 1 - Number(pagination.page)) <= 1 ||
                    page === 1 ||
                    page === totalPages
                  ) {
                    return (
                      <li key={page} className="list-none p-1">
                        <Button
                          size="xs"
                          intent="outline"
                          className={cx(
                            page - 1 === Number(pagination.page) &&
                              '!border-green-3 !bg-green-4 !text-green-3'
                          )}
                          aria-label={`go to page ${page}`}
                          onClick={() => {
                            redirect({ page: page - 1 })
                          }}
                        >
                          {page}
                        </Button>
                      </li>
                    )
                  } else if (page === 2 || page === totalPages - 1) {
                    return morePagesDisplay
                  } else return null
                })}
                <IconButton
                  className="mx-3 md:hidden"
                  aria-label="go forward"
                  onClick={() => {
                    const nextPage = Number(pagination.page) + 1
                    if (isNaN(nextPage) || nextPage > totalPages - 1) return
                    redirect({ page: nextPage.toString() })
                  }}
                >
                  {theme.theme === 'dark' ? (
                    <PlayDark className="h-4 w-4" />
                  ) : (
                    <PlayLight className="h-4 w-4 " />
                  )}
                </IconButton>
              </div>
            )}
            <Button
              className="hidden disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500 md:flex"
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
        </>
      ) : null}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<
  TransactionsFilterProps
> = async (ctx) => {
  const [accountsResponse, walletAddressesResponse] = await Promise.all([
    accountService.list(ctx.req.headers.cookie),
    walletAddressService.listAll(ctx.req.headers.cookie)
  ])

  if (
    !accountsResponse.success ||
    !walletAddressesResponse.success ||
    !walletAddressesResponse.result ||
    !accountsResponse.result
  ) {
    return {
      notFound: true
    }
  }

  const accounts = [{ label: 'All', value: '' }]
  const walletAddresses = [{ label: 'All', value: '', accountId: '' }]

  accountsResponse.result.map((account) =>
    accounts.push({
      label: account.name,
      value: account.id
    })
  )

  walletAddressesResponse.result.map((pp) =>
    walletAddresses.push({
      label: pp.url,
      value: pp.id,
      accountId: pp.accountId
    })
  )

  return {
    props: {
      accounts,
      walletAddresses
    }
  }
}

TransactionsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default TransactionsPage
