import { AccountCard } from '@/components/cards/AccountCard'
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
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useEffect } from 'react'

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

const HomePage: NextPageWithLayout<HomeProps> = ({ accounts, user }) => {
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isUserFirstTime) {
      setTimeout(() => {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
            id="send"
            href="/transfer/send"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
            }}
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Send className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Send
            </span>
          </Link>
          <Link
            id="request"
            href="/transfer/request"
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Request className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Request
            </span>
          </Link>
          <Link
            id="newAccount"
            href="/account/create"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
            }}
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white text-center shadow-md hover:border-green-6"
          >
            <New className="h-8 w-8" />
            <span className="font-medium leading-5 text-green-5 group-hover:text-green-6">
              New account
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3
            className="text-lg font-semibold leading-none text-green"
            id="accounts"
          >
            My Accounts
          </h3>
        </div>
        {accounts.length > 0 ? (
          <div className="grid grid-cols-2 gap-6">
            {accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                idOnboarding={account.assetCode === 'USD' ? 'usdAccount' : ''}
              />
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
    email: string
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
      accounts: response.result ?? [],
      user: {
        firstName: user.result?.firstName ?? '',
        lastName: user.result?.lastName ?? '',
        email: user.result?.email ?? ''
      }
    }
  }
}

HomePage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default HomePage
