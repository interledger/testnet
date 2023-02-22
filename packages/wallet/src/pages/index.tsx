import { AccountCard } from '@/components/AccountCard'
import { Cog } from '@/components/icons/Cog'
import { New } from '@/components/icons/New'
import { Pay } from '@/components/icons/Pay'
import { Receive } from '@/components/icons/Receive'
import { Send } from '@/components/icons/Send'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
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
      <div className="my-5 flex flex-col space-y-5">
        <div className="grid grid-cols-4 gap-2">
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Pay />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Send
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Send />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Pay
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Receive />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Receive
            </span>
          </Link>
          <Link className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <New />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              New account
            </span>
          </Link>
        </div>
      </div>
      <div className="flex w-full flex-col space-y-2 md:max-w-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            My Accounts
          </h3>
          <Cog className="h-8 w-8 text-green" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          {accounts.map((account) => (
            <Link
              href={`accounts/${account.id}`}
              key={account.id}
              className={`rounded-lg
              [&:nth-child(4n+1)]:bg-gradient-primary 
              [&:nth-child(4n+2)]:bg-gradient-violet 
              [&:nth-child(4n+3)]:bg-gradient-pink 
              [&:nth-child(4n+4)]:bg-gradient-orange`}
            >
              <AccountCard
                name={account.name}
                balance={account.balance}
                asset={account.asset.code}
              />
            </Link>
          ))}
        </div>
      </div>
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
