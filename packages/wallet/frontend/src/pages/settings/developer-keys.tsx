import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { DeveloperKeys } from '@/components/settings/DeveloperKeys'
import { SettingsTabs } from '@/components/SettingsTabs'
import { Account, accountService } from '@/lib/api/account'
import { NextPageWithLayout } from '@/lib/types/app'
import {
  formatDate,
  replaceCardWalletAddressDomain,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
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
  const response = await accountService.list(ctx.req.headers.cookie, [
    'walletAddresses',
    'walletAddressKeys'
  ])

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  const accounts = response.result.map((account) => ({
    ...account,
    walletAddresses: account.walletAddresses.map((pp) => ({
      ...pp,
      url: replaceCardWalletAddressDomain(
        replaceWalletAddressProtocol(pp.url),
        pp.isCard
      ),
      keys: pp.keys?.map((key) => ({
        ...key,
        id: key.id,
        publicKey: key.publicKey,
        createdAt: formatDate({
          date: key.createdAt.toString(),
          time: false,
          month: 'long'
        }),
        nickname: key.nickname
      }))
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
