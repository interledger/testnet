import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SettingsTabs } from '@/components/SettingsTabs'

export default function Security() {
  return (
    <AppLayout>
      <PageHeader title="Security Settings" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg"></div>
    </AppLayout>
  )
}
