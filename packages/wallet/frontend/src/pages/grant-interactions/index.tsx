import { AppLayout } from '@/components/layouts/AppLayout'
import { NextPageWithLayout } from '@/lib/types/app'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatAmount } from '@/utils/helpers'
import { Grant, grantsService } from '@/lib/api/grants'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'

type GrantInteractionPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const GrantInteractionPage: NextPageWithLayout<GrantInteractionPageProps> = ({
  grant,
  interactionId,
  nonce,
  clientName
}) => {
  const [openDialog, closeDialog] = useDialog()
  const client = clientName ? clientName : grant.client

  async function finalizeGrantRequest(action: string) {
    const response = await grantsService.finalizeInteraction({
      interactionId: interactionId,
      nonce: nonce,
      action: action
    })

    if (!response.success) {
      openDialog(
        <ErrorDialog onClose={() => closeDialog()} content={response.message} />
      )
      return
    }

    const title =
      action === 'accept'
        ? 'Grant Request Accepted.'
        : 'Grant Request Declined.'
    const content =
      action === 'accept'
        ? 'The grant request was successfully accepted.'
        : 'The grant request was declined. No payments will be made.'
    openDialog(
      <SuccessDialog
        onClose={closeDialog}
        title={title}
        content={content}
        redirect={`${process.env.NEXT_PUBLIC_AUTH_HOST}/interact/${interactionId}/${nonce}/finish`}
        redirectText="Finish"
      />
    )
  }

  return (
    <>
      <div className="mt-10 flex w-full flex-col md:max-w-lg">
        <div className="text-xl text-green">
          <span className="font-semibold">{client}</span> wants to access your
          wallet account and send{' '}
          {grant.access[0].limits?.sendAmount?.formattedAmount}.
        </div>
        <div className="mt-10 flex justify-evenly">
          <Button
            aria-label="accept"
            onClick={() => {
              finalizeGrantRequest('accept')
            }}
          >
            Accept
          </Button>
          <Button
            intent="secondary"
            aria-label="decline"
            onClick={() => {
              finalizeGrantRequest('reject')
            }}
          >
            Decline
          </Button>
        </div>
      </div>
      <Image
        className="mt-20 object-cover"
        src="/grants.webp"
        alt="Grants"
        quality={100}
        width={500}
        height={150}
      />
    </>
  )
}

const querySchema = z.object({
  interactId: z.string(),
  nonce: z.string(),
  clientUri: z.string(),
  clientName: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  grant: Grant
  interactionId: string
  nonce: string
  clientName: string
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)
  if (!result.success) {
    return {
      notFound: true
    }
  }

  const grantInteractionResponse = await grantsService.getInteraction(
    result.data.interactId,
    result.data.nonce,
    ctx.req.headers.cookie
  )

  if (!grantInteractionResponse.success || !grantInteractionResponse.data) {
    return {
      notFound: true
    }
  }

  grantInteractionResponse.data.access.map((access) => {
    access.identifier = access.identifier
      ? access.identifier.replace('https://', '$')
      : null
    if (access.limits) {
      access.limits.receiver = access.limits.receiver
        ? access.limits.receiver.replace('https://', '$')
        : access.limits.receiver ?? null

      if (access.limits.sendAmount) {
        access.limits.sendAmount.formattedAmount = formatAmount({
          value: access.limits.sendAmount.value ?? 0,
          assetCode: access.limits.sendAmount.assetCode,
          assetScale: access.limits.sendAmount.assetScale
        }).amount
      }
    }
  })
  grantInteractionResponse.data.client = result.data.clientUri

  return {
    props: {
      grant: grantInteractionResponse.data,
      interactionId: result.data.interactId,
      nonce: result.data.nonce,
      clientName: result.data.clientName
    }
  }
}

GrantInteractionPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantInteractionPage
