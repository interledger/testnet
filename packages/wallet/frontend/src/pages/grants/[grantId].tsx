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
        <div className="my-6 flex flex-col space-y-2 text-lg text-green sm:my-16 sm:space-y-3">
          <div>
            <span className="font-semibold">Client:</span>
            <span className="font-light"> {grant.client}</span>
          </div>
          <div>
            <span className="font-semibold">Amount to send: </span>
            <span className="font-light">
              {grant.limits.sendAmount.formattedAmount}
            </span>
          </div>
          <div>
            <span className="font-semibold">Amount to receive: </span>
            <span className="font-light">
              {grant.limits.receiveAmount.formattedAmount}
            </span>
          </div>
          <div>
            <span className="font-semibold">Interval between payments: </span>
            <span className="font-light">{grant.limits.interval}</span>
          </div>
          <div>
            <span className="font-semibold">Access type: </span>
            <span className="font-light">
              <Badge
                key={grant.id}
                intent={getStatusBadgeIntent(grant.access.type)}
                size="md"
                text={grant.access.type}
              />
            </span>
          </div>
          <div>
            <span className="font-semibold">Payment Pointer access: </span>
            <span className="font-light">{grant.access.identifier}</span>
          </div>
          <div>
            <span className="font-semibold">Created at: </span>
            <span className="font-light">{grant.createdAt}</span>
          </div>
          <div>
            <span className="font-semibold">Access action: </span>
            <span className="font-light">
              {grant.access.actions.map((permission) => (
                <span>
                  <Badge
                    intent={getStatusBadgeIntent(permission)}
                    size="md"
                    text={permission}
                  />
                  &nbsp;
                </span>
              ))}
            </span>
          </div>
          <div>
            <span className="font-semibold">
              Payment Pointer of the receiver:{' '}
            </span>
            <span className="font-light">{grant.limits.receiver}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-4 font-semibold">State:</span>
            <Badge
              intent={getStatusBadgeIntent(grant.state)}
              size="md"
              text={grant.state}
            />
          </div>
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

  const grantSendAmount = grantResponse.data.limits.sendAmount
  grantResponse.data.limits.sendAmount.formattedAmount = formatAmount({
    value: grantSendAmount.value.toString() ?? 0,
    assetCode: grantSendAmount.assetCode,
    assetScale: grantSendAmount.assetScale
  }).amount

  const grantReceiveAmount = grantResponse.data.limits.receiveAmount
  grantResponse.data.limits.receiveAmount.formattedAmount = formatAmount({
    value: grantReceiveAmount.value.toString() ?? 0,
    assetCode: grantReceiveAmount.assetCode,
    assetScale: grantReceiveAmount.assetScale
  }).amount

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
