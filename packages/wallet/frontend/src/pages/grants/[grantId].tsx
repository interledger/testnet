import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { Badge, getStatusBadgeIntent } from '@/ui/Badge'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatDate } from '@/utils/helpers'
import { Grant, grantsService } from '@/lib/api/grants'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { ConfirmationDialog } from '@/components/dialogs/ConfirmationDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { useRouter } from 'next/router'

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
      router.reload()
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
  }

  return (
    <div className="flex flex-col items-start md:flex-col">
      <PageHeader title="Grant details" />
      <div className="my-16 flex flex-col text-xl text-turqoise">
        <div>
          <span className="font-semibold">Client:</span>
          <span className="font-light"> {grant.client}</span>
        </div>
        <div>
          <span className="font-semibold">Created at: </span>
          <span className="font-light">{grant.createdAt}</span>
        </div>
        <div>
          <span className="font-semibold">Payment Pointer access: </span>
          <span className="font-light">{grant.access.identifier}</span>
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
                warningText="Are you sure you want to revoke this grant?"
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
