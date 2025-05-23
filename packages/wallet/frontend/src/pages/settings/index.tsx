import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { PersonalSettingsForm } from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/SettingsTabs'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
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

export const getServerSideProps: GetServerSideProps<{
  user: UserResponse
  accounts: Account[]
}> = async (ctx) => {
  const response = await userService.me(ctx.req.headers.cookie)
  const accounts = await accountService.list(ctx.req.headers.cookie)

  if (!response.success || !accounts.success) {
    return {
      notFound: true
    }
  }

  if (!response.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      user: response.result,
      accounts: accounts.result ?? []
    }
  }
}

AccountSettingsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountSettingsPage
