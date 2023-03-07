import { AccountCard } from '@/components/AccountCard'
import { New } from '@/components/icons/New'
import { Pay } from '@/components/icons/Pay'
import { Request } from '@/components/icons/Request'
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
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="flex justify-between space-x-2">
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
            href="/transfer/pay"
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Pay className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Pay
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
            className="group flex aspect-square basis-1/4 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <New className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
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
