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
            <PageHeader
                title={`Hello${user.firstName && user.lastName
                    ? ', ' + user.firstName + ' ' + user.lastName + '!'
                    : '!'
                    }`}
                message="Here is your account overview!"
            />
            <h2 className="leading-7 mb-6 text-2xl font-bold">Accounts</h2>
            <div className="grid gap-6 grid-cols-2 max-w-[30rem]">
                <Link className="focus:scale-105 hover:dark:shadow-glow-link focus:dark:shadow-glow-link text-right hover:scale-105 ease-in-out transition-[box-shadow,transform,] duration-200 aspect-[5/3] rounded-lg flex flex-col p-3 border-2" href="/account/create/" id="newAccount">
                    <New className="w-8 h-8" />
                    <span className="leading-[1.1rem] mt-auto overflow-hidden text-ellipsis whitespace-nowrap">New account</span>
                </Link>
                {accounts.length > 0 ?
                    accounts.map((account) => (
                        <>
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        <AccountCard
                            key={account.id}
                            account={account}
                            idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
                        />
                        </>
                    )
                    ) : null}
            </div>
        </>
    )
}

// <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
//   <div className="flex items-center justify-between">
//     <h3
//       className="text-lg font-semibold leading-none text-green"
//       id="accounts"
//     >
//       My Accounts
//     </h3>
//   </div>
//   {accounts.length > 0 ? (
//     <div className="grid grid-cols-2 gap-6">
//       {accounts.map((account) => (
//         <AccountCard
//           key={account.id}
//           account={account}
//           idOnboarding={account.assetCode === 'EUR' ? 'eurAccount' : ''}
//         />
//       ))}
//     </div>
//   ) : (
//     <div className="flex items-center justify-center p-4 text-green">
//       No accounts.
//     </div>
//   )}
// </div>

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

HomePage.getLayout = function(page) {
    return <AppLayout>{page}</AppLayout>
}

export default HomePage
