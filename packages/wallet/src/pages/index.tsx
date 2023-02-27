import { AccountCard } from '@/components/AccountCard'
import { New } from '@/components/icons/New'
import { Pay } from '@/components/icons/Pay'
import { Receive } from '@/components/icons/Receive'
import { Send } from '@/components/icons/Send'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SmallBubbles } from '@/ui/Bubbles'
import { Link } from '@/ui/Link'
import { mockAccountList, type Account } from '@/utils/mocks'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Home({ accounts }: HomeProps) {
  return (
    <AppLayout>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader
          title="Hello, John Doe!"
          message="Here is your account overview!"
        />
        <div className="text-green md:mt-10">
          <h2 className="text-lg font-light md:text-xl">Balance</h2>
          <p className="text-2xl font-semibold md:text-4xl">$2,934</p>
        </div>
      </div>
      <div className="flex w-full flex-col space-y-3 md:max-w-md">
        <div className="mt-2 grid grid-cols-4 gap-2">
          <Link className="h-18 w-18 group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Send className="h-8 w-8" />
            <span className="text-sm font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Send
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Pay className="h-8 w-8" />
            <span className="text-sm font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Pay
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Receive className="h-8 w-8" />
            <span className="text-sm font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Receive
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <New className="h-8 w-8" />
            <span className="text-sm font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              New account
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            My Accounts
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-6">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account} />
          ))}
        </div>
      </div>
      <SmallBubbles className="mt-10 block w-full md:hidden" />
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: Account[]
}> = async (_ctx) => {
  const accounts = await Promise.resolve(mockAccountList())

  return {
    props: {
      accounts
    }
  }
}
