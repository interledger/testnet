import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { cardServiceMock, IUserCard } from '@/lib/api/card'
import { UserCard } from '@/components/userCards/UserCard'

type UserCardPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const UserCardPage: NextPageWithLayout<UserCardPageProps> = ({ card }) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      <div className="space-y-6 max-w-80 mx-auto md:mx-0">
        <UserCard card={card} />
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  card: IUserCard
}> = async (ctx) => {
  const response = await cardServiceMock.getDetails(ctx.req.headers.cookie)

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      card: response.result
    }
  }
}

UserCardPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default UserCardPage
