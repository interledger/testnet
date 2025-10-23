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
import { FEATURES_ENABLED, THEME } from '@/utils/constants'
import { Logo, LogoWallet } from '@/ui/Logo'

type GrantInteractionPageProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const GrantInteractionPage = ({
  grant,
  interactionId,
  nonce,
  clientName: _clientName
}: GrantInteractionPageProps) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()
  const isPendingGrant = grant.state === 'PENDING'
  const imageName =
    THEME === 'dark' ? '/grants-dark.webp' : '/grants-light.webp'

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
    <div className="col-span-full m-auto my-28 px-5 text-center md:px-0">
      <div className="max-w-xl rounded-xl border-2 border-pink-dark dark:border-teal-neon px-5 py-10 shadow-lg flex items-center flex-col">
        {FEATURES_ENABLED ? (
          <LogoWallet className="h-14 ml-5 mb-16"></LogoWallet>
        ) : (
          <Logo className="h-14 ml-5 mb-16" />
        )}
        <Image
          className="mx-auto object-cover"
          src={imageName}
          alt="Grants"
          quality={100}
          width={500}
          height={150}
        />
        <div className="mt-20 text-base">
          {grant.access.length === 1 ? (
            <div>
              Your wallet is requesting access to an amount of{' '}
              {grant.access[0]?.limits?.debitAmount?.formattedAmount}.
            </div>
          ) : (
            <div>
              Your wallet is requesting access to the following amounts:{' '}
              {grant.access
                .map(
                  (accessItem) =>
                    accessItem.limits?.debitAmount?.formattedAmount
                )
                .join(', ')}
              .
            </div>
          )}
          <div>
            Wallet Address client:{' '}
            <span className="font-semibold">{grant.client}</span>
          </div>
          {grant.access.length === 1 ? null : (
            <div className="mt-4">
              <div className="font-semibold mb-2">Amounts:</div>
              {grant.access.map((accessItem, index) => (
                <div key={index} className="mb-1">
                  {accessItem.limits?.debitAmount?.formattedAmount}
                </div>
              ))}
            </div>
          )}
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
    <div className="col-span-full m-auto my-28 px-5 text-center md:px-0">
      <div className="max-w-xl rounded-xl border-2 border-pink-dark dark:border-teal-neon px-5 py-10 shadow-lg">
        <Image
          className="mx-auto object-cover"
          src={imageName}
          alt="Grants"
          quality={100}
          width={500}
          height={150}
        />
        <div className="mt-20 text-xl">
          {grant.access.length === 1 ? (
            <div>
              Your wallet previously granted access to an amount of{' '}
              {grant.access[0]?.limits?.debitAmount?.formattedAmount}.
            </div>
          ) : (
            <div>
              Your wallet previously granted access to the following amounts:{' '}
              {grant.access
                .map(
                  (accessItem) =>
                    accessItem.limits?.debitAmount?.formattedAmount
                )
                .join(', ')}
              .
            </div>
          )}
          {grant.access.length === 1 ? null : (
            <>
              <div className="mt-4">
                <div className="font-semibold mb-2">Amounts:</div>
                {grant.access.map((accessItem, index) => (
                  <div key={index} className="mb-1">
                    {accessItem.limits?.debitAmount?.formattedAmount}
                  </div>
                ))}
              </div>
            </>
          )}
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
          destination: `/no-access?interactionId=${result.data.interactId}&nonce=${result.data.nonce}`
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
