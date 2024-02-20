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
import { useDialog } from '@/lib/hooks/useDialog'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { GrantDetails } from '@/components/GrantDetails'

type GrantPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const GrantPage: NextPageWithLayout<GrantPageProps> = ({ grant }) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

  const handleRevokeConfirmation = async (id: string) => {
    const response = await grantsService.delete(id)
    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={closeDialog}
          title="Success"
          content="Grant successfully revoked."
        />
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
      <PageHeader title="Grant details" />
      <div className="flex flex-col items-start md:flex-col">
        <GrantDetails grant={grant}></GrantDetails>
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

  if (!grantResponse.success || !grantResponse.result) {
    return {
      notFound: true
    }
  }

  grantResponse.result.createdAt = formatDate({
    date: grantResponse.result.createdAt
  })
  grantResponse.result.client = grantResponse.result.client.replace(
    'https://',
    '$'
  )
  grantResponse.result.access.map((access) => {
    access.identifier =
      access.identifier !== null
        ? access.identifier.replace('https://', '$')
        : null
    if (access.limits !== null) {
      access.limits.receiver = access.limits.receiver
        ? access.limits.receiver.replace('https://', '$')
        : access.limits.receiver

      if (access.limits.debitAmount !== null) {
        access.limits.debitAmount.formattedAmount = formatAmount({
          value: access.limits.debitAmount.value ?? 0,
          assetCode: access.limits.debitAmount.assetCode,
          assetScale: access.limits.debitAmount.assetScale
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
      grant: grantResponse.result
    }
  }
}

GrantPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default GrantPage
