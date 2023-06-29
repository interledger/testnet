import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatAmount, formatDate } from '@/utils/helpers'
import { Grant, grantsService } from '@/lib/api/grants'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { useRouter } from 'next/router'
import Image from 'next/image'

type GrantPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const GrantPage: NextPageWithLayout<GrantPageProps> = ({ grant }) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

  const handleRevokeConfirmation = async (id: string) => {
    const response = await grantsService.delete(id)
    if (response.success) {
      openDialog(
        <SuccessDialog onClose={closeDialog} content={response.message} />
      )
      router.push('/grants')
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
  }

  return (
    <>
      <div className="flex flex-col items-start md:flex-col">
        <PageHeader title="Grant details" />
        <div className="my-6 flex flex-col space-y-2 text-lg text-green sm:my-10">
          <div>
            <span className="font-semibold">Client:</span>
            <span className="font-light"> {grant.client}</span>
          </div>
          <div>
            <span className="font-semibold">Created at: </span>
            <span className="font-light">{grant.createdAt}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-4 font-semibold">State:</span>
            <Badge
              intent={getStatusBadgeIntent(grant.state)}
              size="md"
              text={grant.state}
            />
          </div>
          <div className="border-b-2 border-l-0 border-r-0 border-t-0 border-turqoise pb-3 text-xl font-semibold">
            Access - Permissions:
          </div>
          {grant.access.map((accessDetails) => (
            <div
              key={grant.id}
              className="border-b-2 border-l-0 border-r-0 border-t-0 border-turqoise pb-3"
            >
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
                    <>
                      <span key={accessDetails.id} className="text-sm">
                        {permission.toUpperCase()}
                      </span>
                      <div className="ml-2 mr-2 h-1.5 w-1.5 rounded-full bg-green-4 ring-1 ring-green-3" />
                    </>
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
        {grant.state !== 'REVOKED' && (
          <Button
            intent="secondary"
            aria-label="revoke"
            onClick={() => {
              openDialog(
                <ConfirmationDialog
                  confirmText="Revoke Grant"
                  message="Are you sure you want to revoke this grant?"
                  onConfirm={() => handleRevokeConfirmation(grant.id)}
                  onClose={closeDialog}
                />
              )
            }}
          >
            Revoke Grant
          </Button>
        )}
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
  grantId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  grant: Grant
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)

  if (!result.success) {
    return {
      notFound: true
    }
  }
  const grantResponse = await grantsService.get(
    result.data.grantId,
    ctx.req.headers.cookie
  )

  if (!grantResponse.success || !grantResponse.data) {
    return {
      notFound: true
    }
  }

  grantResponse.data.createdAt = formatDate(grantResponse.data.createdAt)
  grantResponse.data.client = grantResponse.data.client.replace('https://', '$')
  grantResponse.data.access.map((access) => {
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
      grant: grantResponse.data
    }
  }
}

GrantPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantPage
