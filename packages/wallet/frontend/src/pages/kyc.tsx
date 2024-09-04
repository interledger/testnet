import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { useEffect } from 'react'

type KYCPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const KYCPage: NextPageWithLayout<KYCPageProps> = ({ url }) => {
  // const [openDialog, closeDialog] = useDialog()
  // const router = useRouter()

  useEffect(() => {
    const onKYCComplete = (e: MessageEvent) => {
      // TODO: Handle the received message from iframe
      // https://docs.gatehub.net/api-documentation/c3OPAp5dM191CDAdwyYS/gatehub-products/gatehub-onboarding#message-events
      console.log('received message from iframe', { e })
    }
    window.addEventListener('message', onKYCComplete, false)

    return () => {
      window.removeEventListener('message', onKYCComplete)
    }
  }, [])

  return (
    <>
      <h2 className="py-2 text-xl font-semibold text-green dark:text-pink-neon">
        Personal Details
      </h2>
      {/* TODO: Styling */}
      <iframe
        src={url}
        sandbox="allow-top-navigation allow-forms allow-same-origin allow-popups allow-scripts"
        scrolling="no"
        frameBorder="0"
        allow="camera;microphone"
      ></iframe>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  url: string
}> = async (ctx) => {
  const response = await userService.getBearerToken(
    { type: 'onboarding' },
    ctx.req.headers.cookie
  )

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      url: response.result.url
    }
  }
}

KYCPage.getLayout = function (page) {
  return (
    <AuthLayout image="People">
      <HeaderLogo header="Complete KYC" />
      {page}
    </AuthLayout>
  )
}

export default KYCPage
