import { CreatePaymentPointerDialog } from '@/components/dialogs/CreatePaymentPointerDialog'
import { FundAccountDialog } from '@/components/dialogs/FundAccountDialog'
import { WithdrawFundsDialog } from '@/components/dialogs/WithdrawFundsDialog'
import { Exchange } from '@/components/icons/Exchange'
import { New } from '@/components/icons/New'
import { Withdraw } from '@/components/icons/Withdraw'
import { Request } from '@/components/icons/Request'
import { AppLayout } from '@/components/layouts/AppLayout'

import { PaymentPointerCard } from '@/components/PaymentPointerCard'
import { Account, accountService } from '@/lib/api/account'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'

import { Link } from '@/ui/Link'
import { formatAmount } from '@/utils/helpers'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { z } from 'zod'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const AccountPage: NextPageWithLayout<AccountPageProps> = ({
  account,
  paymentPointers
}) => {
  const [openDialog, closeDialog] = useDialog()
  const formattedAmount = useMemo(
    () =>
      formatAmount({
        value: account.balance,
        assetCode: account.assetCode,
        assetScale: account.assetScale
      }),
    [account]
  )

  const { isUserFirstTime, setRunOnboarding, setStepIndex, stepIndex } =
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
      <div className="text-green">
        <h2 className="text-lg font-light md:text-xl">Balance</h2>
        <p className="text-2xl font-semibold md:text-4xl">
          {formattedAmount.amount}
        </p>
      </div>
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="my-5 flex justify-between space-x-2">
          <button
            id="paymentPointer"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
              openDialog(
                <CreatePaymentPointerDialog
                  accountName={account.name}
                  onClose={closeDialog}
                />
              )
            }}
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center -space-y-1 rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <New className="h-9 w-7" />
            <div className="-space-y-2 text-[15px]">
              <p className="font-medium text-green-5 group-hover:text-green-6">
                Add payment{' '}
              </p>
              <p className="font-medium text-green-5 group-hover:text-green-6">
                pointer
              </p>
            </div>
          </button>
          <Link
            id="fund"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
              openDialog(
                <FundAccountDialog account={account} onClose={closeDialog} />
              )
            }}
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Request className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Add money
            </span>
          </Link>
          <Link
            id="withdraw"
            onClick={() =>
              openDialog(
                <WithdrawFundsDialog account={account} onClose={closeDialog} />
              )
            }
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Withdraw className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Withdraw
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
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-lg font-bold mix-blend-screen">
            {formattedAmount.symbol}
          </span>
        </div>
        <div className="flex flex-col">
          {paymentPointers.length > 0 ? (
            paymentPointers.map((paymentPointer, index) => (
              <PaymentPointerCard
                key={paymentPointer.id}
                paymentPointer={paymentPointer}
                idOnboarding={
                  account.assetCode === 'USD' && index === 0
                    ? `viewTransactions`
                    : ''
                }
              />
            ))
          ) : (
            <div className="flex items-center justify-center p-4 text-green">
              No payment pointers found for this account.
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  paymentPointers: PaymentPointer[]
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [accountResponse, paymentPointersResponse] = await Promise.all([
    accountService.get(result.data.accountId, ctx.req.headers.cookie),
    paymentPointerService.list(result.data.accountId, ctx.req.headers.cookie)
  ])

  if (!accountResponse.success || !paymentPointersResponse.success) {
    return {
      notFound: true
    }
  }

  if (!accountResponse.data || !paymentPointersResponse.data) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      account: accountResponse.data,
      paymentPointers: paymentPointersResponse.data
    }
  }
}

AccountPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountPage
