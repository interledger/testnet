import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { CardButtonMenu } from '@/components/userCards/CardButtonMenu'
import { UserCard } from '@/components/userCards/UserCard'
import { useCardContext } from '@/lib/context/card'
import { NextPageWithLayout } from '@/lib/types/app'

const UserCardPage: NextPageWithLayout = () => {
  const { cardType } = useCardContext()
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      <div className="flex justify-center items-center flex-col gap-6">
        <UserCard type={cardType} />
        <CardButtonMenu />
      </div>
    </>
  )
}

UserCardPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default UserCardPage
