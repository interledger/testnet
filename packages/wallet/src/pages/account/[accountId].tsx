import { CreatePaymentPointerDialog } from '@/components/dialogs/CreatePaymentPointerDialog'
import { FundAccountDialog } from '@/components/dialogs/FundAccountDialog'
import { Exchange } from '@/components/icons/Exchange'
import { New } from '@/components/icons/New'
import { Request } from '@/components/icons/Request'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { PaymentPointerCard } from '@/components/PaymentPointerCard'
import { useDialog } from '@/lib/hooks/useDialog'
import { Link } from '@/ui/Link'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function AccountPage({ account }: AccountPageProps) {
  const [openDialog, closeDialog] = useDialog()
  return (
    <AppLayout>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader
          title="Hello, John Doe!"
          message="Here is your account overview!"
        />
        <div className="text-green md:mt-10">
          <h2 className="text-lg font-light md:text-xl">Balance</h2>
          <p className="text-2xl font-semibold md:text-4xl">
            {account.balance}
          </p>
        </div>
      </div>
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="my-5 flex justify-between space-x-2">
          <button
            onClick={() =>
              openDialog(<CreatePaymentPointerDialog onClose={closeDialog} />)
            }
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center -space-y-1 rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <New className="h-7 w-7" />
            <div className="-space-y-2">
              <p className="font-medium text-green-5 group-hover:text-green-6">
                Add payment{' '}
              </p>
              <p className="font-medium text-green-5 group-hover:text-green-6">
                pointer
              </p>
            </div>
          </button>
          <Link
            onClick={() =>
              openDialog(<FundAccountDialog onClose={closeDialog} />)
            }
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Request className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Fund
            </span>
          </Link>
          <Link className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6">
            <Exchange className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Exchange
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            Account
          </h3>
        </div>
        <div className="flex items-center justify-between rounded-md bg-gradient-primary px-3 py-2">
          <span className="font-semibold text-green">{account.name}</span>
          <span className="inline-flex h-8 w-10 items-center justify-center rounded-md bg-white font-bold mix-blend-screen">
            {account.asset.code}
          </span>
        </div>
        <div className="flex flex-col">
          {account.paymentPointers.map((paymentPointer) => (
            <PaymentPointerCard
              key={paymentPointer.id}
              paymentPointer={paymentPointer}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: {
    id: string
    name: string
    balance: string
    asset: {
      code: string
    }
    paymentPointers: {
      id: string
      url: string
    }[]
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
        balance: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(7344.02),
        asset: {
          code: 'USD'
        },
        paymentPointers: [
          { id: '1', url: '$rafiki.money/pp1' },
          { id: '2', url: '$rafiki.money/pp2' },
          { id: '3', url: '$rafiki.money/pp3' },
          { id: '4', url: '$rafiki.money/pp4' },
          { id: '5', url: '$rafiki.money/pp5' }
        ]
      }
    }
  }
}
