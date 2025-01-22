import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { cardService } from '@/lib/api/card'
import { UserCard } from '@/components/userCards/UserCard'
import { ICardResponse } from '@wallet/shared'

type UserCardPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const UserCardPage: NextPageWithLayout<UserCardPageProps> = ({ card }) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      {card ? (
        <UserCard card={card} />
      ) : (
        `You don't have a card linked to your account.`
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  card: ICardResponse
}> = async (ctx) => {
  const response = await cardService.getDetails(ctx.req.headers.cookie)

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      card: response.result[0] ?? null
    }
  }
}

UserCardPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default UserCardPage
