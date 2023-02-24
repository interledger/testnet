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
      <SmallBubbles className="absolute inset-x-0 bottom-0 block w-full md:hidden" />
      <Image
        className="absolute bottom-10 hidden object-cover md:block"
        src="/settings.webp"
        alt="Settings"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
