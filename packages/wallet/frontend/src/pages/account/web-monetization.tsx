import { AppLayout } from '@/components/layouts/AppLayout'
import { PaymentPointerCard } from '@/components/cards/PaymentPointerCard'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { NextPageWithLayout } from '@/lib/types/app'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { AccountTabs } from '@/components/tabs/AccountTabs'
import { z } from 'zod'
import BackButton from '@/components/BackButton'
import { FormattedAmount, formatAmount } from '@/utils/helpers'
import { Account, accountService } from '@/lib/api/account'

type WebMonetizationPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const WebMonetizationPage: NextPageWithLayout<WebMonetizationPageProps> = ({
  account,
  wmPaymentPointers,
  balance
}) => {
  return (
    <>
      <AccountTabs accountId={account.id} />
      <div className="flex items-center">
        <BackButton />
        <div className="text-green" id="balance">
          <h2 className="text-lg font-light md:text-xl">Balance</h2>
          <p className="text-2xl font-semibold md:text-4xl">{balance.amount}</p>
        </div>
      </div>

      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="flex items-center justify-between rounded-md bg-gradient-primary px-3 py-2">
          <span className="font-semibold text-green">{account.name}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-lg font-bold mix-blend-screen">
            {balance.symbol}
          </span>
        </div>
        <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
          <div className="flex flex-col">
            {wmPaymentPointers.length > 0 ? (
              wmPaymentPointers.map((paymentPointer) => (
                <PaymentPointerCard
                  key={paymentPointer.id}
                  paymentPointer={paymentPointer}
                  isWM={true}
                />
              ))
            ) : (
              <div className="flex items-center justify-center p-4 text-green">
                No payment pointers found for Web Monetization.
              </div>
            )}
          </div>
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
  wmPaymentPointers: PaymentPointer[]
  balance: FormattedAmount
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)
  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [accountResponse, wmPaymentPointersResponse] = await Promise.all([
    accountService.get(result.data.accountId, ctx.req.headers.cookie),
    paymentPointerService.list(result.data.accountId, ctx.req.headers.cookie)
  ])

  if (
    !accountResponse.success ||
    !wmPaymentPointersResponse.success ||
    !accountResponse.data ||
    !wmPaymentPointersResponse.data
  ) {
    return {
      notFound: true
    }
  }

  let balanceSum = 0
  let assetScalePP =
    wmPaymentPointersResponse.data.wmPaymentPointers[0].assetScale
  wmPaymentPointersResponse.data.wmPaymentPointers.map((pp) => {
    pp.url = pp.url.replace('https://', '$')
    balanceSum += Number(pp.balance)
    assetScalePP = pp.assetScale
  })

  return {
    props: {
      account: accountResponse.data,
      wmPaymentPointers: wmPaymentPointersResponse.data.wmPaymentPointers,
      balance: formatAmount({
        value: balanceSum.toString(),
        assetCode: accountResponse.data.assetCode,
        assetScale: assetScalePP || 2
      })
    }
  }
}

WebMonetizationPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default WebMonetizationPage
