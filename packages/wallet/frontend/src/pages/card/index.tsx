import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { cardServiceMock, IUserCard } from '@/lib/api/card'
import { UserCard } from '@/components/userCards/UserCard'
import { UserCardSettings } from '@/components/userCards/UserCardSettings'

type UserCardPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const UserCardPage: NextPageWithLayout<UserCardPageProps> = ({ card }) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-[20rem_1fr] max-w-3xl gap-x-24">
        <UserCard card={card} />
        <UserCardSettings />
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
