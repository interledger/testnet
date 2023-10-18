import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { DeveloperKeys } from '@/components/settings/DeveloperKeys'
import { SettingsTabs } from '@/components/tabs/SettingsTabs'
import { Account, accountService } from '@/lib/api/account'
import { NextPageWithLayout } from '@/lib/types/app'
import { formatDate } from '@/utils/helpers'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'

type DeveloperKeysPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const DeveloperKeysPage: NextPageWithLayout<DeveloperKeysPageProps> = ({
  accounts
}) => {
  return (
    <>
      <PageHeader title="Developer Keys" />
      <SettingsTabs />

      <div className="flex w-full flex-col md:max-w-lg">
        <DeveloperKeys accounts={accounts} />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: Account[]
}> = async (ctx) => {
  const response = await accountService.list(
    ctx.req.headers.cookie,
    'paymentPointers'
  )

  if (!response.success || !response.data) {
    return {
      notFound: true
    }
  }

  const accounts = response.data.map((account) => ({
    ...account,
    paymentPointers: account.paymentPointers.map((pp) => ({
      ...pp,
      url: pp.url.replace('https://', '$'),
      keyIds: pp.keyIds
        ? {
            id: pp.keyIds.id,
            publicKey: pp.keyIds.publicKey,
            createdOn: formatDate(pp.keyIds.createdOn, false)
          }
        : null
    }))
  }))

  return {
    props: {
      accounts
    }
  }
}

DeveloperKeysPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default DeveloperKeysPage
