import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import {
  PersonalSettingsForm,
  type PersonalDetailsProps
} from '@/components/settings/PersonalSettingsForm'
import { SettingsTabs } from '@/components/SettingsTabs'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'

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
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  personalDetails: PersonalDetailsProps
}> = async (_ctx) => {
  return {
    props: {
      personalDetails: {
        firstName: 'John',
        lastName: 'Doe',
        address: 'Edmond Street 5, 10555, London, United Kingdom',
        email: 'john@doe.com'
      }
    }
  }
}
