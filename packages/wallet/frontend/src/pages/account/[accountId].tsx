import { CreateWalletAddressDialog } from '@/components/dialogs/CreateWalletAddressDialog'
import { FundAccountDialog } from '@/components/dialogs/FundAccountDialog'
import { WithdrawFundsDialog } from '@/components/dialogs/WithdrawFundsDialog'
import { New } from '@/components/icons/New'
import { Withdraw } from '@/components/icons/Withdraw'
import { Request } from '@/components/icons/Request'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Account, accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import { Link } from '@/ui/Link'
import { formatAmount, replaceWalletAddressProtocol } from '@/utils/helpers'
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

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const AccountPage: NextPageWithLayout<AccountPageProps> = ({
  account,
  allWalletAddresses
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
      <div className="mt-6 items-center text-green" id="balance">
        <h2 className="text-lg font-light md:text-xl">Balance</h2>
        <div className="text-2xl font-semibold md:text-4xl">
          {formattedAmount.amount}
        </div>
      </div>
      <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
        <div className="my-5 flex justify-between space-x-2">
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
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center -space-y-1 rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <New className="h-9 w-7" />
            <div className="-space-y-2 text-[15px]">
              <p className="font-medium text-green-5 group-hover:text-green-6">
                Add payment{' '}
              </p>
              <p className="font-medium text-green-5 group-hover:text-green-6">
                pointer
              </p>
            </div>
          </button>
          <Link
            id="fund"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
              openDialog(
                <FundAccountDialog account={account} onClose={closeDialog} />
              )
            }}
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Request className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Add money
            </span>
          </Link>
          <Link
            onClick={() =>
              openDialog(
                <WithdrawFundsDialog account={account} onClose={closeDialog} />
              )
            }
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Withdraw className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Withdraw
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            Payment Pointers
          </h3>
        </div>
        <div className="flex flex-col">
          {allWalletAddresses.length > 0 ? (
            <WalletAddressesTable
              account={account}
              walletAddresses={allWalletAddresses}
            />
          ) : (
            <div className="flex items-center justify-center p-4 text-green">
              <span>No payment pointers found for this account.</span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  allWalletAddresses: WalletAddressResponse[]
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
    pp.url = replaceWalletAddressProtocol(pp.url)
  })

  return {
    props: {
      account: accountResponse.result,
      allWalletAddresses: walletAddressesResponse.result
    }
  }
}

AccountPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountPage
