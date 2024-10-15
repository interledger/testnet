import { HeaderLogo } from '@/components/HeaderLogo'
import AuthLayout from '@/components/layouts/AuthLayout'
import { userService } from '@/lib/api/user'
import { NextPageWithLayout } from '@/lib/types/app'
import {
  GateHubMessageType,
  type GateHubMessageError
} from '@/lib/types/windowMessages'
import { FEATURES_ENABLED } from '@/utils/constants'
import { useRouter } from 'next/router'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { useEffect } from 'react'

type KYCPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

type MessageData =
  | {
      type: GateHubMessageType.OnboardingCompleted
      value: 'submitted' | 'resubmitted'
    }
  | { type: GateHubMessageType.OnboardingError; value: GateHubMessageError }
  | { type: GateHubMessageType.OnboardingInitialized }

const KYCPage: NextPageWithLayout<KYCPageProps> = ({
  url,
  addUserToGatewayUrl
}) => {
  const router = useRouter()

  useEffect(() => {
    // TODO: Handle the received message from iframe
    // https://docs.gatehub.net/api-documentation/c3OPAp5dM191CDAdwyYS/gatehub-products/gatehub-onboarding#message-events
    const onMessage = async (e: MessageEvent<MessageData>) => {
      switch (e.data.type) {
        case GateHubMessageType.OnboardingCompleted:
          console.log(
            'received message from iframe',
            GateHubMessageType.OnboardingCompleted,
            JSON.stringify(e.data, null, 2)
          )
          await fetch(addUserToGatewayUrl, {
            method: 'POST',
            body: JSON.stringify(e.data, null, 2),
            credentials: 'include'
          })
          router.replace('/')
          break
        case GateHubMessageType.OnboardingError:
        case GateHubMessageType.OnboardingInitialized:
          break
      }
    }
    window.addEventListener('message', onMessage, false)

    return () => {
      window.removeEventListener('message', onMessage)
    }
  }, [addUserToGatewayUrl, router])

  return (
    <>
      <h2 className="py-2 text-xl font-semibold text-green dark:text-pink-neon">
        Personal Details
      </h2>
      {FEATURES_ENABLED ? null : (
        <h2>
          The e-mail and phone number must be accurate data in the Sandbox.
        </h2>
      )}
      <div className="w-full h-full">
        <iframe
          src={url}
          className="w-full h-full"
          sandbox="allow-top-navigation allow-forms allow-same-origin allow-popups allow-scripts"
          allow="camera;microphone"
        ></iframe>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  url: string
  addUserToGatewayUrl: string
}> = async (ctx) => {
  const response = await userService.getGateHubIframeSrc(
    'onboarding',
    ctx.req.headers.cookie
  )

  if (!response.success || !response.result) {
    return {
      notFound: true
    }
  }

  return {
    props: {
      url: response.result.url,
      addUserToGatewayUrl: `${process.env.NEXT_PUBLIC_BACKEND_URL}/gatehub/add-user-to-gateway`
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
