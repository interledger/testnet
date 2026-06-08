import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { PersonalSettingsForm } from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/SettingsTabs'
import { withAuth } from '@/lib/serverAuth'
import { NextPageWithLayout } from '@/lib/types/app'
import { InferGetServerSidePropsType } from 'next'
import Image from 'next/image'
import { UserResponse } from '@wallet/shared'
import { THEME } from '@/utils/constants'
import { Account, accountService } from '@/lib/api/account'

type AccountSettingsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const AccountSettingsPage: NextPageWithLayout<AccountSettingsProps> = ({
  user,
  accounts
}) => {
  const imageName =
    THEME === 'dark' ? '/bird-envelope-dark.webp' : '/bird-envelope-light.webp'
  return (
    <>
      <PageHeader title="Account Settings" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <PersonalSettingsForm user={user} accounts={accounts} />
      </div>
      <Image
        className="object-contain mt-10"
        src={imageName}
        alt="Settings"
        quality={100}
        width={500}
        height={200}
      />
    </>
  )
}

export const getServerSideProps = withAuth<{
  user: UserResponse
  accounts: Account[]
}>(async (ctx) => {
  const accounts = await accountService.list(ctx.req.headers.cookie)

  if (!accounts.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      user: ctx.user,
      accounts: accounts.result ?? []
    }
  }
})

AccountSettingsPage.getLayout = function (page) {
  return (
    <AppLayout isCardsVisible={page.props.user.isCardsVisible}>
      {page}
    </AppLayout>
  )
}

export default AccountSettingsPage
