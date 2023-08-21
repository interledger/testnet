import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatAmount, formatDate } from '@/utils/helpers'
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
  nonce
}) => {
  const [openDialog, closeDialog] = useDialog()

  async function answerGrantRequest(isAccepted: boolean) {
    const response = await grantsService.answerGrantRequest(
      interactionId,
      nonce,
      isAccepted
    )

    if (!response.success) {
      openDialog(
        <ErrorDialog onClose={() => closeDialog()} content={response.message} />
      )
      return
    }

    openDialog(
      <SuccessDialog
        onClose={closeDialog}
        title="Grant Request Accepted."
        content="The grant request was successfully accepted."
        redirect={`/grants`}
        redirectText="View grants"
      />
    )
  }

  return (
    <>
      <div className="flex flex-col items-start md:flex-col">
        <PageHeader title="Grant request" />
        <div className="my-6 flex flex-col space-y-2 text-lg text-green sm:my-10">
          <div>
            <span className="font-semibold">Client: </span>
            <span className="font-light">{grant.client}</span>
          </div>
          <div>
            <span className="font-semibold">Created at: </span>
            <span className="font-light">{grant.createdAt}</span>
          </div>
          <div className="border-b border-b-green-5 pb-3 text-xl font-semibold">
            Access - Permissions:
          </div>
          {grant.access.map((accessDetails) => (
            <div key={grant.id} className="border-b border-b-green-5 pb-3">
              <div>
                <span className="font-semibold">Access type: </span>
                <span className="text-sm">
                  {accessDetails.type.toUpperCase()}
                </span>
              </div>
              {accessDetails.identifier && (
                <div>
                  <span className="font-semibold">
                    Payment Pointer access:{' '}
                  </span>
                  <span className="font-light">{accessDetails.identifier}</span>
                </div>
              )}
              <div>
                <div className="flex flex-row items-center">
                  <span className="font-semibold">Access action: </span>
                  <div className="ml-2 mr-2 h-1.5 w-1.5 rounded-full bg-green-4 ring-1 ring-green-3" />
                  {accessDetails.actions.map((permission) => (
                    <div key={accessDetails.id} className="flex items-center">
                      <span className="text-sm">
                        {permission.toUpperCase()}
                      </span>
                      <div className="ml-2 mr-2 h-1.5 w-1.5 rounded-full bg-green-4 ring-1 ring-green-3" />
                    </div>
                  ))}
                </div>
              </div>
              {accessDetails.limits && (
                <>
                  {accessDetails.limits.sendAmount && (
                    <div>
                      <span className="font-semibold">Amount to send: </span>
                      <span className="font-light">
                        {accessDetails.limits.sendAmount.formattedAmount}
                      </span>
                    </div>
                  )}
                  {accessDetails.limits.receiveAmount && (
                    <div>
                      <span className="font-semibold">Amount to receive: </span>
                      <span className="font-light">
                        {accessDetails.limits.receiveAmount.formattedAmount}
                      </span>
                    </div>
                  )}
                  {accessDetails.limits.receiver && (
                    <div>
                      <span className="font-semibold">
                        Payment Pointer of the receiver:{' '}
                      </span>
                      <span className="font-light">
                        {accessDetails.limits.receiver}
                      </span>
                    </div>
                  )}
                  {accessDetails.limits.interval && (
                    <div>
                      <span className="font-semibold">
                        Interval between payments:{' '}
                      </span>
                      <span className="font-light">
                        {accessDetails.limits.interval}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
        <div>
          <Button
            aria-label="accept"
            onClick={() => {
              answerGrantRequest(true)
            }}
          >
            Accept
          </Button>
          <Button
            intent="secondary"
            aria-label="decline"
            onClick={() => {
              answerGrantRequest(false)
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
  interactionId: z.string(),
  nonce: z.string()
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
    result.data.interactionId,
    result.data.nonce,
    ctx.req.headers.cookie
  )

  if (!grantInteractionResponse.success || !grantInteractionResponse.data) {
    return {
      notFound: true
    }
  }

  grantInteractionResponse.data.createdAt = formatDate(
    grantInteractionResponse.data.createdAt
  )
  grantInteractionResponse.data.client =
    grantInteractionResponse.data.client.replace('https://', '$')
  grantInteractionResponse.data.access.map((access) => {
    access.identifier =
      access.identifier !== null
        ? access.identifier.replace('https://', '$')
        : null
    if (access.limits !== null) {
      access.limits.receiver = access.limits.receiver
        ? access.limits.receiver.replace('https://', '$')
        : access.limits.receiver

      if (access.limits.sendAmount !== null) {
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

  return {
    props: {
      grant: grantInteractionResponse.data,
      interactionId: result.data.interactionId,
      nonce: result.data.nonce
    }
  }
}

GrantInteractionPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantInteractionPage
