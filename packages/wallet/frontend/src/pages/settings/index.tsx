import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { PersonalSettingsForm } from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/SettingsTabs'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { useTheme } from 'next-themes'
import Image from 'next/image'
import { UserResponse } from '@wallet/shared'

type AccountSettingsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const AccountSettingsPage: NextPageWithLayout<AccountSettingsProps> = ({
  user
}) => {
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark'
      ? '/bird-envelope-dark.webp'
      : '/bird-envelope-light.webp'
  return (
    <>
      <PageHeader title="Account Settings" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <PersonalSettingsForm user={user} />
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
}> = async (ctx) => {
  const response = await userService.me(ctx.req.headers.cookie)

  if (!response.success) {
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
      user: response.result
    }
  }
}

AccountSettingsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountSettingsPage
