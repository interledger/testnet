import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/ui/Button'
import { Link } from '@/ui/Link'
import { mockAccountList, type Account } from '@/utils/mocks'
import {
  type InferGetServerSidePropsType,
  type GetServerSideProps
} from 'next/types'

type HomeProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Home({ accounts }: HomeProps) {
  return (
    <AppLayout>
      <PageHeader
        title="Hello, John Doe!"
        message="Here is your account overview!"
      />
      <div className="mt-10 flex flex-col space-y-10">
        <div>
          <h2 className="text-lg font-light md:text-xl">Balance</h2>
          <p className="text-2xl font-semibold md:text-4xl">$2,934</p>
        </div>
        <div className="flex w-full flex-col space-y-2 md:max-w-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">My Accounts</h3>
            <Button intent="outline" size="sm" aria-label="manage accounts">
              Manage Accounts
            </Button>
          </div>
          <div className="flex flex-col space-y-5">
            {accounts.map((account) => (
              <Link
                href={`accounts/${account.id}`}
                key={account.id}
                className="flex items-center justify-between rounded-md bg-turqoise px-4 py-4"
              >
                <span className="font-semibold">{account.name}</span>
                <span>
                  {account.balance} {account.asset.code}
                </span>
              </Link>
            ))}
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
