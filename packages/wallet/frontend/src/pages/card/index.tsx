import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { CardButtonMenu } from '@/components/userCards/CardButtonMenu'
import { UserCard } from '@/components/userCards/UserCard'
import { NextPageWithLayout } from '@/lib/types/app'
import { useState } from 'react'

const CARD_TYPES = {
  normal: 'normal',
  details: 'details',
  frozen: 'frozen'
} as const

export type CardTypes = keyof typeof CARD_TYPES

function CardContainer() {
  const [state, setState] = useState<CardTypes>('normal')
  return (
    <div className="space-y-6 max-w-[329px]">
      <UserCard type={state} />
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
