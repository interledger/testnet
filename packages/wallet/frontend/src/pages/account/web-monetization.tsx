import { AppLayout } from '@/components/layouts/AppLayout'
import { PaymentPointerCard } from '@/components/cards/PaymentPointerCard'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { NextPageWithLayout } from '@/lib/types/app'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { PageHeader } from '@/components/PageHeader'
import { AccountTabs } from '@/components/tabs/AccountTabs'
import { z } from 'zod'

type WebMonetizationPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const WebMonetizationPage: NextPageWithLayout<WebMonetizationPageProps> = ({
  accountId,
  wmPaymentPointers
}) => {
  return (
    <>
      <PageHeader title="Web Monetization Payment Pointers" />
      <AccountTabs accountId={accountId} />
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
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  accountId: string
  wmPaymentPointers: PaymentPointer[]
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)
  if (!result.success) {
    return {
      notFound: true
    }
  }

  const wmPaymentPointersResponse = await paymentPointerService.list(
    result.data.accountId,
    ctx.req.headers.cookie
  )

  if (!wmPaymentPointersResponse.success || !wmPaymentPointersResponse.data) {
    return {
      notFound: true
    }
  }

  const wmPaymentPointers = wmPaymentPointersResponse.data.wmPaymentPointers.map((pp) => ({
    ...pp,
    url: pp.url.replace('https://', '$')
  }))

  return {
    props: {
      accountId: result.data.accountId,
      wmPaymentPointers
    }
  }
}

WebMonetizationPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default WebMonetizationPage
