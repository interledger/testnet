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
  console.log(account)
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
            <h3 className="text-lg font-semibold text-brand-green-4">
              Account
            </h3>
          </div>
          <div className="flex flex-col space-y-5">
            <div className="flex items-center justify-between rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] px-3 py-2">
              <span className="font-semibold text-brand-green-4">
                {account.name}
              </span>
              <span className="inline-flex h-8 w-10 items-center justify-center rounded-md bg-white font-bold mix-blend-screen">
                {account.asset.code}
              </span>
            </div>
            <div className="flex max-h-[300px] min-h-[300px] flex-col space-y-2 overflow-y-scroll px-4">
              {account.paymentPointers.map((paymentPointer) => (
                <Link key={paymentPointer} href={`/pp/${paymentPointer}`}>
                  {paymentPointer}
                </Link>
              ))}
            </div>
          </div>
        </div>
        <div className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-lg px-20 pb-20">
          <div className="grid grid-cols-3 gap-2">
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <span className="font-medium text-brand-green-4">Pay</span>
            </Link>
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
              <span className="font-medium text-brand-green-4">Receive</span>
            </Link>
            <Link className="flex aspect-square flex-col items-center justify-center rounded-lg border border-[#92DBCA] bg-white shadow-md">
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
