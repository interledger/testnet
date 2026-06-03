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
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { IconButton } from '@/ui/IconButton'
import { Play } from '@/components/icons/Play'
import { cx } from 'class-variance-authority'
import { useMemo, useState } from 'react'
import { grantsService } from '@/lib/api/grants'
import { GrantResponse } from '@wallet/shared'
import { GrantDetailsDialog } from '@/components/dialogs/GrantDetailsDialog'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { userService } from '@/lib/api/user'

type GrantsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const GrantsPage: NextPageWithLayout<GrantsPageProps> = () => {
  const redirect = useRedirect<GrantListArgs>({
    path: '/grants',
    persistQuery: false
  })
  const [grantsList, pagination, fetch, loading, error] = useGrants()
  const grants = grantsList.grants

  const [selectedGrant, setSelectedGrant] = useState<GrantResponse | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleRowClick = async (grantId: string) => {
    const res = await grantsService.get(grantId)
    if (res.success && res.result) {
      setSelectedGrant(res.result)
      setIsDialogOpen(true)
    }
  }

  const totalPages = useMemo<number>(
    () => Math.ceil(grants.pageInfo.totalCount / Number(pagination.pageSize)),
    [grants.pageInfo.totalCount, pagination.pageSize]
  )

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  const morePagesDisplay = (
    <>
      <div className="bg-green-4 ring-green-3 mx-1 mt-6 h-1 w-1 rounded-full ring-1" />
      <div className="bg-green-4 ring-green-3 mx-1 mt-6 h-1 w-1 rounded-full ring-1" />
      <div className="bg-green-4 ring-green-3 mx-1 mt-6 h-1 w-1 rounded-full ring-1" />
    </>
  )
  let groupByDate = ''

  return (
    <div className="flex flex-col items-start justify-start space-y-5 lg:max-w-xl xl:max-w-5xl">
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Grants" />
      </div>

      {error ? (
        <div className="flex w-full flex-col items-center justify-center">
          <p className="text-lg">{error}</p>
          <Button
            aria-label="refresh grants table"
            intent="outline"
            onClick={() => fetch(pagination)}
          >
            Refresh table
          </Button>
        </div>
      ) : loading ? (
        <Table.Shimmer />
      ) : (
        <div className="w-full" id="grantsList">
          <Table>
            <Table.Head
              columns={['Date', 'Client', 'Status']}
              sort={[
                {
                  header: 'Date',
                  sortFn: () => {
                    pagination.sortOrder === 'DESC'
                      ? redirect({ sortOrder: 'ASC' })
                      : redirect({ sortOrder: 'DESC' })
                  },
                  getDirection: () => {
                    return pagination.sortOrder === 'DESC' ? 'down' : 'up'
                  }
                }
              ]}
              hideForMobile={['Status']}
            />
            <Table.Body>
              {grants.edges.length ? (
                grants.edges.map((grant) => {
                  let showDateHeader = false
                  if (
                    groupByDate !==
                    formatDateNoTime({ date: grant.node.createdAt })
                  ) {
                    groupByDate = formatDateNoTime({
                      date: grant.node.createdAt
                    })
                    showDateHeader = true
                  }
                  return (
                    <>
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
                        key={grant.node.id}
                        onClick={() => handleRowClick(grant.node.id)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-purple-dark transition"
                      >
                        <Table.Cell className="whitespace-nowrap">
                          {formatDateOnlyTime({ date: grant.node.createdAt })}
                        </Table.Cell>
                        <Table.Cell className="whitespace-nowrap">
                          {replaceWalletAddressProtocol(grant.node.client)}
                        </Table.Cell>
                        <Table.Cell className="hidden sm:table-cell">
                          {!grant.node.finalizationReason ? (
                            <Badge
                              intent={getStatusBadgeIntent(grant.node.state)}
                              size="md"
                              text={grant.node.state}
                            />
                          ) : null}
                          {grant.node.finalizationReason ? (
                            <Badge
                              intent={getStatusBadgeIntent(
                                grant.node.finalizationReason
                              )}
                              size="md"
                              text={
                                grant.node.finalizationReason === 'REVOKED'
                                  ? 'REVOKED'
                                  : grant.node.finalizationReason === 'ISSUED'
                                    ? 'APPROVED'
                                    : 'REJECTED'
                              }
                            />
                          ) : null}
                        </Table.Cell>
                      </Table.Row>
                    </>
                  )
                })
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={4} className="text-center">
                    No grants found.
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
              disabled={Number(pagination.page) - 1 < 0}
              onClick={() => {
                const previousPage = Number(pagination.page) - 1
                if (isNaN(previousPage) || previousPage < 0) return
                redirect({
                  page: previousPage.toString(),
                  sortOrder: pagination.sortOrder
                })
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
                    redirect({
                      page: previousPage.toString(),
                      sortOrder: pagination.sortOrder
                    })
                  }}
                >
                  <Play className="h-4 w-4 rotate-180 text-green dark:text-pink-neon" />
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
                          intent="outline"
                          className={cx(
                            page - 1 === Number(pagination.page) &&
                              'border-pink-dark text-pink-dark dark:border-teal-neon dark:text-teal-neon'
                          )}
                          aria-label={`go to page ${page}`}
                          onClick={() => {
                            redirect({
                              page: page - 1,
                              sortOrder: pagination.sortOrder
                            })
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
                    redirect({
                      page: nextPage.toString(),
                      sortOrder: pagination.sortOrder
                    })
                  }}
                >
                  <Play className="h-4 w-4 text-green dark:text-pink-neon" />
                </IconButton>
              </div>
            )}
            <Button
              className="hidden md:flex"
              aria-label="go to next page"
              disabled={Number(pagination.page) + 1 > totalPages - 1}
              onClick={() => {
                const nextPage = Number(pagination.page) + 1
                if (isNaN(nextPage) || nextPage > totalPages - 1) return
                redirect({
                  page: nextPage.toString(),
                  sortOrder: pagination.sortOrder
                })
              }}
            >
              Next
            </Button>
          </div>
        </>
      ) : null}

      {isDialogOpen && selectedGrant && (
        <GrantDetailsDialog
          grant={selectedGrant}
          onClose={() => setIsDialogOpen(false)}
        />
      )}
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<{
  user: {
    isCardsVisible: boolean
  }
}> = async (ctx) => {
  const user = await userService.me(ctx.req.headers.cookie)

  if (!user.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
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
