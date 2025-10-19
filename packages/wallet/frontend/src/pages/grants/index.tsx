import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/ui/Button'
import { useRedirect } from '@/lib/hooks/useRedirect'
import { useGrants } from '@/lib/hooks/useGrants'
import { GRANTS_DISPLAY_NR } from '@/utils/constants'
import { NextPageWithLayout } from '@/lib/types/app'
import { GrantListArgs } from '@/lib/api/grants'
import { Table } from '@/ui/Table'
import { formatDate, replaceWalletAddressProtocol } from '@/utils/helpers'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import { useState } from 'react'
import { grantsService } from '@/lib/api/grants'
import { GrantResponse } from '@wallet/shared'
import { GrantDetailsDialog } from '@/components/dialogs/GrantDetailsDialog'

const GrantsPage: NextPageWithLayout = () => {
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
            <Table.Head columns={['', 'Client', 'Status', 'Date']} />
            <Table.Body>
              {grants.edges.length ? (
                grants.edges.map((grant) => (
                  <Table.Row
                    key={grant.node.id}
                    onClick={() => handleRowClick(grant.node.id)}
                    className="cursor-pointer hover:bg-gray-100 dark:hover:bg-purple-dark transition"
                  >
                    <Table.Cell className="w-1">{''}</Table.Cell>
                    <Table.Cell className="whitespace-nowrap">
                      {replaceWalletAddressProtocol(grant.node.client)}
                    </Table.Cell>
                    <Table.Cell>
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
                    <Table.Cell className="whitespace-nowrap">
                      {formatDate({ date: grant.node.createdAt })}
                    </Table.Cell>
                  </Table.Row>
                ))
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

      {!error &&
      !loading &&
      (grants.pageInfo.hasPreviousPage || grants.pageInfo.hasNextPage) ? (
        <div className="mt-5 flex w-full items-center justify-between">
          <Button
            className="disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500"
            aria-label="go to previous page"
            disabled={!grants.pageInfo.hasPreviousPage}
            onClick={() => {
              redirect({
                last: GRANTS_DISPLAY_NR,
                before: grants.pageInfo.startCursor
              })
            }}
          >
            Previous
          </Button>
          <Button
            className="disabled:pointer-events-none disabled:from-gray-400 disabled:to-gray-500"
            aria-label="go to next page"
            disabled={!grants.pageInfo.hasNextPage}
            onClick={() => {
              redirect({
                first: GRANTS_DISPLAY_NR,
                after: grants.pageInfo.endCursor
              })
            }}
          >
            Next
          </Button>
        </div>
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

GrantsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantsPage
