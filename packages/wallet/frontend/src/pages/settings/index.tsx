import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { PersonalSettingsForm } from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/tabs/SettingsTabs'
import { type User, userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { SmallBubbles } from '@/ui/Bubbles'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Image from 'next/image'

type AccountSettingsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const AccountSettingsPage: NextPageWithLayout<AccountSettingsProps> = ({
  user
}) => {
  return (
    <>
      <PageHeader title="Personal Settings" message="Edit your details" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <PersonalSettingsForm user={user} />
        {/* <Divider />
        <ChangePasswordForm /> */}
      </div>
      <SmallBubbles className="mt-10 block w-full md:hidden" />
      <Image
        className="hidden md:block"
        src="/settings.webp"
        alt="Settings"
        quality={100}
        width={400}
        height={100}
      />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  user: User
}> = async (ctx) => {
  const result = await userService.me(ctx.req.headers.cookie)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  if (!result.data) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      user: result.data
    }
  }
}

AccountSettingsPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountSettingsPage
