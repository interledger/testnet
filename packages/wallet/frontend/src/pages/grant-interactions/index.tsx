import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'
import { formatAmount, replaceWalletAddressProtocol } from '@/utils/helpers'
import { grantsService } from '@/lib/api/grants'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { useRouter } from 'next/router'
import { GrantResponse } from '@wallet/shared'
import { useTheme } from 'next-themes'

type GrantInteractionPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const GrantInteractionPage = ({
  grant,
  interactionId,
  nonce,
  clientName
}: GrantInteractionPageProps) => {
  const [openDialog, closeDialog] = useDialog()
  const client = clientName ? clientName : grant.client
  const router = useRouter()
  const access = grant.access.find((el) => el.type === 'outgoing-payment')
  const isPendingGrant = grant.state === 'PENDING'
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark' ? '/grants-dark.webp' : '/grants-light.webp'

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

    router.push(
      `${process.env.NEXT_PUBLIC_AUTH_HOST}/interact/${interactionId}/${nonce}/finish`
    )
  }

  return isPendingGrant ? (
    <div className="flex h-full flex-col items-center justify-center px-5 text-center md:px-0">
      <div className="rounded-xl border-2 border-turqoise px-5 py-10 shadow-lg">
        <Image
          className="mx-auto object-cover"
          src={imageName}
          alt="Grants"
          quality={100}
          width={500}
          height={150}
        />
        <div className="mt-20 text-base">
          <div>
            <span className="font-semibold">{client}</span> is requesting access
            to make a payment on your behalf.
          </div>
          <div>
            Wallet Address client:{' '}
            <span className="font-semibold">{grant.client}</span>
          </div>
          <div>
            Total amount to debit:{' '}
            <span className="font-semibold">
              {access?.limits?.debitAmount?.formattedAmount}
            </span>
          </div>
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-xl justify-evenly">
          <Button
            aria-label="accept"
            onClick={() => {
              finalizeGrantRequest('accept')
            }}
          >
            Accept
          </Button>
          <Button
            intent="outline"
            aria-label="decline"
            onClick={() => {
              finalizeGrantRequest('reject')
            }}
          >
            Decline
          </Button>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex h-full flex-col items-center justify-center px-5 text-center md:px-0">
      <div className="rounded-xl border-2 border-turqoise px-5 py-10 shadow-lg">
        <Image
          className="mx-auto object-cover"
          src={imageName}
          alt="Grants"
          quality={100}
          width={500}
          height={150}
        />
        <div className="mt-20 text-xl text-green">
          The request from <span className="font-semibold">{client}</span> to
          make a payment on your behalf for the amount of
          {access?.limits?.debitAmount?.formattedAmount}, was previously
          processed.
        </div>
        <div className="mx-auto mt-10 flex w-full max-w-xl justify-evenly">
          <Button
            aria-label="ok"
            onClick={() => {
              router.push('grants')
            }}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  )
}

const querySchema = z.object({
  interactId: z.string(),
  nonce: z.string(),
  clientUri: z.string(),
  clientName: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  grant: GrantResponse
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

  if (!grantInteractionResponse.success || !grantInteractionResponse.result) {
    if (grantInteractionResponse.message === 'NO_ACCESS') {
      return {
        redirect: {
          permanent: false,
          destination: '/no-access'
        }
      }
    }

    return {
      notFound: true
    }
  }

  grantInteractionResponse.result.access.map((access) => {
    access.identifier = access.identifier
      ? replaceWalletAddressProtocol(access.identifier)
      : null
    if (access.limits) {
      access.limits.receiver = access.limits.receiver
        ? replaceWalletAddressProtocol(access.limits.receiver)
        : (access.limits.receiver ?? null)

      if (access.limits.debitAmount) {
        access.limits.debitAmount.formattedAmount = formatAmount({
          value: access.limits.debitAmount.value ?? 0,
          assetCode: access.limits.debitAmount.assetCode,
          assetScale: access.limits.debitAmount.assetScale
        }).amount
      }
    }
  })
  grantInteractionResponse.result.client = result.data.clientUri

  return {
    props: {
      grant: grantInteractionResponse.result,
      interactionId: result.data.interactId,
      nonce: result.data.nonce,
      clientName: result.data.clientName
    }
  }
}

export default GrantInteractionPage
