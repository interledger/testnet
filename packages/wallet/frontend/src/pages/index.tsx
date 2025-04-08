import { AccountCard } from '@/components/cards/AccountCard'
import { New } from '@/components/icons/New'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { accountService } from '@/lib/api/account'
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
import { FEATURES_ENABLED } from '@/utils/constants'

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

const HomePage: NextPageWithLayout<HomeProps> = ({ accounts, user }) => {
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isUserFirstTime) {
      setStepIndex(stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader
        title={`Hello${
          user.firstName && user.lastName
            ? ', ' + user.firstName + ' ' + user.lastName + '!'
            : '!'
        }`}
        message="Here is your account overview!"
      />
      <h2 className="mb-6 text-2xl font-bold leading-7">Accounts</h2>
      <div className="grid grid-cols-2 gap-6 md:max-w-[30rem]">
        <Link
          className="flex aspect-[5/3] flex-col rounded-lg border-2 p-3 text-right transition-[box-shadow,transform,] duration-200 ease-in-out hover:scale-105 focus:scale-105 hover:dark:shadow-glow-link focus:dark:shadow-glow-link"
          href="/account/create/"
          id="newAccount"
        >
          <New className="h-8 w-8" />
          <span className="mt-auto overflow-hidden text-ellipsis whitespace-nowrap leading-[1.1rem]">
            New account
          </span>
        </Link>
        {accounts.length > 0
          ? accounts.map((account) =>
              !account.isHidden ? (
                <AccountCard
                  key={account.id}
                  account={account}
                  idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                  isCard={FEATURES_ENABLED && account.assetCode === 'EUR'}
                />
              ) : null
            )
          : null}
      </div>
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
