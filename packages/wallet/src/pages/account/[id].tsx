import { New } from '@/components/icons/New'
import { Pay } from '@/components/icons/Pay'
import { Receive } from '@/components/icons/Receive'
import { Send } from '@/components/icons/Send'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Link } from '@/ui/Link'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function AccountPage({ account }: AccountPageProps) {
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
        <div className="mt-2 flex justify-between space-x-2">
          <Link className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Send className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Send
            </span>
          </Link>
          <Link className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Pay className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Pay
            </span>
          </Link>
          <Link className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Receive className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6 sm:text-base">
              Receive
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            My Accounts
          </h3>
        </div>
        <div className="grid grid-cols-2 gap-6">{account.name}</div>
      </div>
    </AppLayout>
  )
}

const querySchema = z.object({
  id: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: {
    id: string
    name: string
    balance: number
    asset: {
      code: string
    }
    paymentPointers: string[]
  }
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  // TODO: Additional check on the backend response

  return {
    props: {
      account: {
        id: 'ID',
        name: 'Account #1',
        balance: 7344.02,
        asset: {
          code: 'USD'
        },
        paymentPointers: ['$pp1.example', '$pp2.example', '$pp3.example']
      }
    }
  }
}
