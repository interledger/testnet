import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import {
  PersonalSettingsForm,
  type PersonalDetailsProps
} from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/SettingsTabs'
import { userService } from '@/lib/api/user'
import { SmallBubbles } from '@/ui/Bubbles'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import Image from 'next/image'

type AccountSettingsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

export default function AccountSettings({
  personalDetails
}: AccountSettingsProps) {
  return (
    <AppLayout>
      <PageHeader title="Personal Settings" message="Edit your details" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <PersonalSettingsForm personalDetails={personalDetails} />
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
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  personalDetails: PersonalDetailsProps
}> = async (ctx) => {
  console.log('here I am')
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
      personalDetails: {
        firstName: result.data.firstName,
        lastName: result.data.lastName,
        address: result.data.address,
        email: result.data.email
      }
    }
  }
}
