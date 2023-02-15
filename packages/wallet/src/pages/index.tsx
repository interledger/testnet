import { AccountCard } from '@/components/AccountCard'
import { Cog } from '@/components/Icons/Cog'
import { New } from '@/components/Icons/New'
import { Pay } from '@/components/Icons/Pay'
import { Receive } from '@/components/Icons/Receive'
import { Send } from '@/components/Icons/Send'
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
        <div className="md:mt-10">
          <h2 className="text-lg font-light md:text-xl">Balance</h2>
          <p className="text-2xl font-semibold md:text-4xl">$2,934</p>
        </div>
      </div>
      <div className="mt-5 flex w-full flex-col space-y-2 md:max-w-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-brand-green-4">
            My Accounts
          </h3>
          <Cog className="h-8 w-8 text-brand-green-3" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          {accounts.map((account) => (
            <Link
              href={`accounts/${account.id}`}
              key={account.id}
              className={`rounded-lg bg-gradient-to-r
              [&:nth-child(4n+1)]:from-[#92DBCA] [&:nth-child(4n+1)]:to-[#56B1AF] 
              [&:nth-child(4n+2)]:from-[#9DB8D6] [&:nth-child(4n+2)]:to-[#9D92D0] 
              [&:nth-child(4n+3)]:from-[#FFC2D6] [&:nth-child(4n+3)]:to-[#FFA0AC] 
              [&:nth-child(4n+4)]:from-[#E4D099] [&:nth-child(4n+4)]:to-[#FFB380]`}
            >
              <AccountCard
                name={account.name}
                balance={account.balance}
                asset={account.asset.code}
              />
            </Link>
          ))}
        </div>
        <div className="flex flex-col space-y-5">
          <div className="grid grid-cols-4 gap-2">
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <Pay />
              <span className="font-medium text-brand-green-4">Send</span>
            </Link>
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <Send />
              <span className="font-medium text-brand-green-4">Pay</span>
            </Link>
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <Receive />
              <span className="font-medium text-brand-green-4">Receive</span>
            </Link>
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <New />
              <span className="font-medium text-brand-green-4">
                New account
              </span>
            </Link>
          </div>
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
