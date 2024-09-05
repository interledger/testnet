import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { CardButtonMenu } from '@/components/userCards/CardButtonMenu'
import { CardType, UserCard } from '@/components/userCards/UserCard'
import { NextPageWithLayout } from '@/lib/types/app'
import { useState } from 'react'

function CardContainer() {
  const [state, setState] = useState<CardType>('normal')
  return (
    <div className="space-y-6 max-w-[329px]">
      <UserCard type={state} name="John Doe" />
      <CardButtonMenu fn={setState} />
    </div>
  )
}
const UserCardPage: NextPageWithLayout = () => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      <CardContainer />
    </>
  )
}

UserCardPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default UserCardPage
