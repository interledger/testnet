import { AccountCard } from '@/components/AccountCard'
import { New } from '@/components/icons/New'
import { Request } from '@/components/icons/Request'
import { Send } from '@/components/icons/Send'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { accountService } from '@/lib/api/account'
import { SmallBubbles } from '@/ui/Bubbles'
import { Link } from '@/ui/Link'
import { type Account } from '@/lib/api/account'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { userService } from '@/lib/api/user'
import type { NextPageWithLayout } from '@/lib/types/app'

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

const HomePage: NextPageWithLayout<HomeProps> = ({ accounts, user }) => {
  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader
          title={`Hello${
            user.firstName && user.lastName
              ? ', ' + user.firstName + ' ' + user.lastName + '!'
              : '!'
          }`}
          message="Here is your account overview!"
        />
      </div>
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="my-5 flex justify-between space-x-2">
          <Link
            href="/transfer/send"
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Send className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Send
            </span>
          </Link>
          <Link
            href="/transfer/request"
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Request className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Request
            </span>
          </Link>
          <Link
            href="/account/create"
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white text-center shadow-md hover:border-green-6"
          >
            <New className="h-8 w-8" />
            <span className="font-medium leading-5 text-green-5 group-hover:text-green-6">
              New account
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            My Accounts
          </h3>
        </div>
        {accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {accounts.map((account) => (
              <AccountCard key={account.id} account={account} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-green">
            No accounts.
          </div>
        )}
      </div>
      <SmallBubbles className="mt-10 block w-full md:hidden" />
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: Account[]
  user: {
    firstName: string
    lastName: string
  }
}> = async (ctx) => {
  const response = await accountService.list(ctx.req.headers.cookie)
  const user = await userService.me(ctx.req.headers.cookie)

  if (!response.success || !user.success) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      accounts: response.data ?? [],
      user: {
        firstName: user.data?.firstName ?? '',
        lastName: user.data?.lastName ?? ''
      }
    }
  }
}

HomePage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default HomePage
