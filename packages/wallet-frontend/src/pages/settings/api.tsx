import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { ApiKeys } from '@/components/settings/ApiKeys'
import { SettingsTabs } from '@/components/SettingsTabs'
import { SmallBubbles } from '@/ui/Bubbles'
import Image from 'next/image'

export default function Notifications() {
  return (
    <AppLayout>
      <PageHeader title="API Settings" message="Edit API details" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <ApiKeys />
      </div>
      <SmallBubbles className="mt-10 block w-full md:hidden" />
      <Image
        className="mt-10 hidden md:block"
        src="/settings.webp"
        alt="Settings"
        quality={100}
        width={400}
        height={100}
      />
    </AppLayout>
  )
}
