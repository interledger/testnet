import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
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
import { GrantDetails } from '@/components/GrantDetails'

type GrantInteractionPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const GrantInteractionPage: NextPageWithLayout<GrantInteractionPageProps> = ({
  grant,
  interactionId,
  nonce
}) => {
  const [openDialog, closeDialog] = useDialog()

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
      <PageHeader title="Grant request" />
      <div className="flex w-full flex-col md:max-w-lg">
        <GrantDetails grant={grant} isFinalizedInteraction={false}></GrantDetails>
        <div className="flex justify-evenly">
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
  clientUri: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  grant: Grant
  interactionId: string
  nonce: string
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

      if (access.limits.receiveAmount !== null) {
        access.limits.receiveAmount.formattedAmount = formatAmount({
          value: access.limits.receiveAmount.value ?? 0,
          assetCode: access.limits.receiveAmount.assetCode,
          assetScale: access.limits.receiveAmount.assetScale
        }).amount
      }
    }
  })
  grantInteractionResponse.data.client = result.data.clientUri

  return {
    props: {
      grant: grantInteractionResponse.data,
      interactionId: result.data.interactId,
      nonce: result.data.nonce
    }
  }
}

GrantInteractionPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantInteractionPage
