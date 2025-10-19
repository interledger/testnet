import { CreateWalletAddressDialog } from '@/components/dialogs/CreateWalletAddressDialog'
import { New } from '@/components/icons/New'
import { Withdraw } from '@/components/icons/Withdraw'
import { Request } from '@/components/icons/Request'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Account, accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import {
  formatAmount,
  replaceCardWalletAddressDomain,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { useMemo } from 'react'
import { useEffect } from 'react'
import { z } from 'zod'
import { useSnapshot } from 'valtio'
import { balanceState } from '@/lib/balance'
import { PageHeader } from '@/components/PageHeader'
import { WalletAddressResponse } from '@wallet/shared'
import { WalletAddressesTable } from '@/components/WalletAddressesTable'
import { Link } from '@/ui/Link'
import { DepositDialog } from '@/components/dialogs/DepositDialog'
import { FEATURES_ENABLED } from '@/utils/constants'
import { Card } from '@/components/icons/CardButtons'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const AccountPage: NextPageWithLayout<AccountPageProps> = ({
  account,
  walletAddresses
}) => {
  const [openDialog, closeDialog] = useDialog()
  const { accountsSnapshot } = useSnapshot(balanceState)
  const formattedAmount = useMemo(() => {
    const snapshotAccount = accountsSnapshot.find(
      (item) => item.assetCode === account.assetCode
    )
    return formatAmount({
      value: snapshotAccount?.balance || account.balance,
      assetCode: account.assetCode,
      assetScale: account.assetScale
    })
  }, [account, accountsSnapshot])

  const { isUserFirstTime, setRunOnboarding, setStepIndex, stepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isUserFirstTime) {
      setTimeout(() => {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader title={account.name} />
      <div className="mb-6" id="balance">
        <h2 className="mb-2 text-xl">Balance</h2>
        <div className="text-3xl font-bold">{formattedAmount.amount}</div>
      </div>
      <div className="my-12 flex md:max-w-lg md:items-center gap-4 flex-col sm:flex-row">
        <div className="flex gap-4">
          <button
            id="walletAddress"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
              openDialog(
                <CreateWalletAddressDialog
                  accountName={account.name}
                  onClose={closeDialog}
                />
              )
            }}
            className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
          >
            <New className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
            <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
              Add wallet address
            </span>
          </button>
          <Link
            id="fund"
            href={FEATURES_ENABLED ? '/deposit' : undefined}
            onClick={
              FEATURES_ENABLED
                ? undefined
                : () => {
                    openDialog(
                      <DepositDialog
                        accountId={account.id}
                        assetCode={account.assetCode}
                        onClose={closeDialog}
                      />
                    )
                  }
            }
            className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
          >
            <Request className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
            <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
              Deposit
            </span>
          </Link>
        </div>
        {FEATURES_ENABLED ? (
          <div className="flex gap-4">
            <Link
              id="withdraw"
              href="/withdraw"
              className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
            >
              <Withdraw className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
              <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
                Withdraw
              </span>
            </Link>
            <Link
              id="cards"
              href="/card"
              className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
            >
              <Card className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
              <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
                Card
              </span>
            </Link>
          </div>
        ) : null}
      </div>
      <h2 className="mb-2 text-xl sm:text-2xl font-bold">
        Wallet Address list <div className="text-sm">(Payment Pointers)</div>
      </h2>

      {walletAddresses.length > 0 ? (
        <WalletAddressesTable
          account={account}
          walletAddresses={walletAddresses}
        />
      ) : (
        <div className="mt-4 text-sm">
          No Wallet Addresses (Payment Pointers) found for this account.
        </div>
      )}
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  walletAddresses: WalletAddressResponse[]
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)
  if (!result.success) {
    return {
      notFound: true
    }
  }

  const [accountResponse, walletAddressesResponse] = await Promise.all([
    accountService.get(result.data.accountId, ctx.req.headers.cookie),
    walletAddressService.list(result.data.accountId, ctx.req.headers.cookie)
  ])

  if (
    !accountResponse.success ||
    !walletAddressesResponse.success ||
    !accountResponse.result ||
    !walletAddressesResponse.result
  ) {
    return {
      notFound: true
    }
  }
  walletAddressesResponse.result.map((pp) => {
    pp.url = replaceCardWalletAddressDomain(
      replaceWalletAddressProtocol(pp.url),
      pp.isCard
    )
  })

  return {
    props: {
      account: accountResponse.result,
      walletAddresses: walletAddressesResponse.result
    }
  }
}

AccountPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountPage
