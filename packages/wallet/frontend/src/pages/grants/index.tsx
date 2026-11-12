import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/ui/Button'
import { useRedirect } from '@/lib/hooks/useRedirect'
import { useGrants } from '@/lib/hooks/useGrants'
import { NextPageWithLayout } from '@/lib/types/app'
import { GrantListArgs } from '@/lib/api/grants'
import { Table } from '@/ui/Table'
import {
  formatDateNoTime,
  formatDateOnlyTime,
  replaceCardWalletAddressDomain,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import { IconButton } from '@/ui/IconButton'
import { Play } from '@/components/icons/Play'
import { useMemo, useState, Fragment } from 'react'
import { walletAddressService } from '@/lib/api/walletAddress'
import { Select, SelectOption } from '@/ui/forms/Select'
import { GrantResponse } from '@wallet/shared'
import { GrantStatusBadge } from '@/components/GrantStatusBadge'
import { GrantDetailsDialog } from '@/components/dialogs/GrantDetailsDialog'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { userService } from '@/lib/api/user'
import { formatAmount } from '@/utils/helpers'

type GrantsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const states: SelectOption[] = [
  { label: 'All', value: '' },
  { label: 'Approved', value: 'ISSUED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Awaiting client', value: 'APPROVED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Revoked', value: 'REVOKED' }
]

// Cursors are only valid for the filters they were issued for
const resetPaging = { cursor: '', direction: '' }

const GrantsPage: NextPageWithLayout<GrantsPageProps> = ({
  walletAddresses
}) => {
  const redirect = useRedirect<GrantListArgs>({
    path: '/grants',
    persistQuery: true
  })
  const walletAddressIds = useMemo(
    () => walletAddresses.map(({ value }) => value),
    [walletAddresses]
  )
  const [grantsList, filters, fetch, loading, error, canListAll] =
    useGrants(walletAddressIds)
  const { grants, pageInfo } = grantsList

  const walletAddressOptions = useMemo<SelectOption[]>(
    () =>
      canListAll
        ? [{ label: 'All', value: '' }, ...walletAddresses]
        : walletAddresses,
    [canListAll, walletAddresses]
  )
  const currentWalletAddress = useMemo<SelectOption | undefined>(
    () =>
      walletAddressOptions.find(
        (walletAddress) =>
          walletAddress.value === (filters.walletAddressId ?? '')
      ),
    [walletAddressOptions, filters.walletAddressId]
  )
  const currentState = useMemo<SelectOption>(
    () => states.find((state) => state.value === filters.state) ?? states[0],
    [filters.state]
  )

  const goToPreviousPage = () => {
    if (!pageInfo.hasPreviousPage || !pageInfo.startCursor) return
    redirect({
      walletAddressId: filters.walletAddressId,
      cursor: pageInfo.startCursor,
      direction: 'previous'
    })
  }
  const goToNextPage = () => {
    if (!pageInfo.hasNextPage || !pageInfo.endCursor) return
    redirect({
      walletAddressId: filters.walletAddressId,
      cursor: pageInfo.endCursor,
      direction: 'next'
    })
  }

  // A revoked grant drops out of a status filter, which could empty this page
  const handleRevoked = () => {
    const pageWouldEmpty =
      grants.length === 1 &&
      !!filters.cursor &&
      !!filters.state &&
      filters.state !== 'REVOKED'

    if (pageWouldEmpty) {
      redirect({ walletAddressId: filters.walletAddressId, ...resetPaging })
    } else {
      fetch(filters)
    }
  }

  const [selectedGrant, setSelectedGrant] = useState<GrantResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Clone so formatting doesn't mutate list state
  const handleRowClick = (grant: GrantResponse) => {
    const selected = structuredClone(grant)
    formattedAmount(selected)
    setSelectedGrant(selected)
    setIsDialogOpen(true)
  }

  const formattedAmount = (grant: GrantResponse) => {
    grant.access.map((access) => {
      if (access.limits !== null) {
        if (access.limits.debitAmount !== null) {
          access.limits.debitAmount.formattedAmount = formatAmount({
            value: access.limits.debitAmount.value ?? 0,
            assetCode: access.limits.debitAmount.assetCode,
            assetScale: access.limits.debitAmount.assetScale
          }).amount
        }

        if (access.limits.receiveAmount !== null) {
          access.limits.receiveAmount.formattedAmount = formatAmount({
            value: access.limits.receiveAmount.value ?? 0,
            assetCode: access.limits.receiveAmount.assetCode,
            assetScale: access.limits.receiveAmount.assetScale
          }).amount
        }
      }
    })
  }

  let groupByDate = ''

  return (
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-5xl">
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Grants" />
      </div>
      <div className="grid w-full grid-cols-4 gap-3 md:grid-cols-6">
        <div className="col-span-4 md:col-span-3">
          <Select
            options={walletAddressOptions}
            label="Wallet Address"
            placeholder="Select wallet address..."
            value={currentWalletAddress}
            onChange={(option) => {
              if (option) {
                redirect({ walletAddressId: option.value, ...resetPaging })
              }
            }}
          />
        </div>
        <div className="col-span-4 md:col-span-3">
          <Select
            options={states}
            label="Status"
            placeholder="Select status..."
            value={currentState}
            onChange={(option) => {
              if (option) {
                redirect({ state: option.value, ...resetPaging })
              }
            }}
          />
        </div>
      </div>

      {error ? (
        <div className="flex w-full flex-col items-center justify-center">
          <p className="text-lg">{error}</p>
          <Button
            aria-label="refresh grants table"
            intent="outline"
            onClick={() => fetch(filters)}
          >
            Refresh table
          </Button>
        </div>
      ) : loading ? (
        <Table.Shimmer />
      ) : (
        <div className="w-full" id="grantsList">
          <Table className="w-full">
            <Table.Head
              columns={['Date', 'Client', 'Status']}
              sort={[
                {
                  header: 'Date',
                  sortFn: () => {
                    redirect({
                      sortOrder: filters.sortOrder === 'DESC' ? 'ASC' : 'DESC',
                      ...resetPaging
                    })
                  },
                  getDirection: () => {
                    return filters.sortOrder === 'DESC' ? 'down' : 'up'
                  }
                }
              ]}
              hideForMobile={['Status']}
            />
            <Table.Body>
              {grants.length ? (
                grants.map((grant) => {
                  let showDateHeader = false
                  if (
                    groupByDate !== formatDateNoTime({ date: grant.createdAt })
                  ) {
                    groupByDate = formatDateNoTime({
                      date: grant.createdAt
                    })
                    showDateHeader = true
                  }
                  return (
                    <Fragment key={grant.id}>
                      {showDateHeader ? (
                        <Table.Row>
                          <Table.Cell className="bg-green-dark dark:bg-pink-dark text-white text-center text-sm rounded-xl !p-1">
                            {groupByDate}
                          </Table.Cell>
                          <Table.Cell className="!p-1">&nbsp;</Table.Cell>
                          <Table.Cell className="!p-1 hidden sm:table-cell">
                            &nbsp;
                          </Table.Cell>
                        </Table.Row>
                      ) : null}
                      <Table.Row
                        key={grant.id}
                        onClick={() => handleRowClick(grant)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-purple-dark transition"
                      >
                        <Table.Cell className="whitespace-nowrap">
                          {formatDateOnlyTime({ date: grant.createdAt })}
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap">
                          {replaceWalletAddressProtocol(grant.client)}
                        </Table.Cell>
                        <Table.Cell className="hidden sm:table-cell">
                          <GrantStatusBadge grant={grant} />
                        </Table.Cell>
                      </Table.Row>
                    </Fragment>
                  )
                })
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={4} className="text-center">
                    {walletAddresses.length
                      ? 'No grants found.'
                      : 'Create a wallet address to see its grants.'}
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
        </div>
      )}

      {!error && !loading ? (
        <>
          <div className="mt-5 flex w-full items-center justify-between">
            <Button
              className="hidden md:flex"
              aria-label="go to previous page"
              disabled={!pageInfo.hasPreviousPage}
              onClick={goToPreviousPage}
            >
              Previous
            </Button>
            <div className="flex w-full justify-center md:hidden">
              <IconButton
                className="mx-3"
                aria-label="go back"
                disabled={!pageInfo.hasPreviousPage}
                onClick={goToPreviousPage}
              >
                <Play className="h-4 w-4 rotate-180 text-green dark:text-pink-neon" />
              </IconButton>
              <IconButton
                className="mx-3"
                aria-label="go forward"
                disabled={!pageInfo.hasNextPage}
                onClick={goToNextPage}
              >
                <Play className="h-4 w-4 text-green dark:text-pink-neon" />
              </IconButton>
            </div>
            <Button
              className="hidden md:flex"
              aria-label="go to next page"
              disabled={!pageInfo.hasNextPage}
              onClick={goToNextPage}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}

      {isDialogOpen && selectedGrant && (
        <GrantDetailsDialog
          grant={selectedGrant}
          onRevoked={handleRevoked}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<{
  walletAddresses: SelectOption[]
  user: {
    isCardsVisible: boolean
  }
}> = async (ctx) => {
  const [user, walletAddressesResponse] = await Promise.all([
    userService.me(ctx.req.headers.cookie),
    walletAddressService.listAll(ctx.req.headers.cookie)
  ])

  if (
    !user.success ||
    !walletAddressesResponse.success ||
    !walletAddressesResponse.result
  ) {
    return {
      notFound: true
    }
  }

  const walletAddresses = walletAddressesResponse.result.map(
    (walletAddress) => ({
      label: replaceCardWalletAddressDomain(
        replaceWalletAddressProtocol(walletAddress.url),
        walletAddress.isCard
      ),
      value: walletAddress.id
    })
  )

  return {
    props: {
      walletAddresses,
      user: {
        isCardsVisible: user.result?.isCardsVisible ?? false
      }
    }
  }
}

GrantsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default GrantsPage
