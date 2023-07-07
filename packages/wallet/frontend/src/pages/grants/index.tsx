import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { Grant, grantsService } from '@/lib/api/grants'
import { formatDate } from '@/utils/helpers'
import { GrantCard } from '@/components/cards/GrantCard'

type GrantsPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const GrantsPage: NextPageWithLayout<GrantsPageProps> = ({ grants }) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Grants" />
      </div>
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="mt-12 flex items-center justify-between rounded-md bg-gradient-primary px-3 py-2">
          <span className="font-semibold text-green">Clients</span>
        </div>

        <div className="flex flex-col">
          {grants.length > 0 ? (
            grants.map((grant) => <GrantCard key={grant.id} grant={grant} />)
          ) : (
            <div className="flex items-center justify-center p-4 text-green">
              No grants found for this wallet.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  grants: Grant[]
}> = async (ctx) => {
  const grantsResponse = await grantsService.list(ctx.req.headers.cookie)

  if (!grantsResponse.success || !grantsResponse.data) {
    return {
      notFound: true
    }
  }

  const grants = grantsResponse.data?.map((grant) => ({
    ...grant,
    createdAt: formatDate(grant.createdAt)
  }))

  return {
    props: {
      grants
    }
  }
}

GrantsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantsPage
