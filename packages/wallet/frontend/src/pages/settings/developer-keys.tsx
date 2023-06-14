import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { ApiKeys } from '@/components/settings/ApiKeys'
import { SettingsTabs } from '@/components/SettingsTabs'
import { NextPageWithLayout } from '@/lib/types/app'
import { SmallBubbles } from '@/ui/Bubbles'
import Image from 'next/image'

const DeveloperPage: NextPageWithLayout = () => {
  return (
    <>
      <PageHeader title="Developer Keys"/>
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
    </>
  )
}

DeveloperPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default DeveloperPage
