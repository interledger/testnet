import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { ApiKeys } from '@/components/settings/ApiKeys'
import { SettingsTabs } from '@/components/SettingsTabs'

export default function Notifications() {
  return (
    <AppLayout>
      <PageHeader title="API Settings" message="Edit API details" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <ApiKeys />
      </div>
    </AppLayout>
  )
}
