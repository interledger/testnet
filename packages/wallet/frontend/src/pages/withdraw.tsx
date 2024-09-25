import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { useEffect } from 'react'

type WithdrawPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const WithdrawPage: NextPageWithLayout<WithdrawPageProps> = ({ url }) => {
  useEffect(() => {
    const onWithdrawComplete = (e: MessageEvent) => {
      // TODO: Handle the received message from iframe
      // https://docs.gatehub.net/api-documentation/c3OPAp5dM191CDAdwyYS/gatehub-products/gatehub-onboarding#message-events
      console.log('received message from iframe', { e })
    }
    window.addEventListener('message', onWithdrawComplete, false)

    return () => {
      window.removeEventListener('message', onWithdrawComplete)
    }
  }, [])

  return (
    <>
      <PageHeader title="Withdraw" />
      <iframe
        src={url}
        sandbox="allow-top-navigation allow-forms allow-same-origin allow-popups allow-scripts"
        className="w-full h-full md:w-[85%]"
      ></iframe>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  url: string
}> = async (ctx) => {
  const response = await userService.getGateHubIframeSrc(
    'withdrawal',
    ctx.req.headers.cookie
  )

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  const url = new URL(response.result.url)
  url.searchParams.append('paymentType', 'withdraw')

  return {
    props: {
      url: url.href
    }
  }
}

WithdrawPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default WithdrawPage
