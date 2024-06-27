import { CreateWalletAddressDialog } from '@/components/dialogs/CreateWalletAddressDialog'
import { FundAccountDialog } from '@/components/dialogs/FundAccountDialog'
import { WithdrawFundsDialog } from '@/components/dialogs/WithdrawFundsDialog'
import { Exchange } from '@/components/icons/Exchange'
import { New } from '@/components/icons/New'
import { Withdraw } from '@/components/icons/Withdraw'
import { Request } from '@/components/icons/Request'
import { AppLayout } from '@/components/layouts/AppLayout'
import { WalletAddressCard } from '@/components/cards/WalletAddressCard'
import { Account, accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import { Link } from '@/ui/Link'
import {
  FormattedAmount,
  formatAmount,
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
import { WalletAddressResponse } from '@wallet/shared/src'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const AccountPage: NextPageWithLayout<AccountPageProps> = ({
  account,
  allWalletAddresses
  //TODO add this to account.balance
  // balance
}) => {
  const [openDialog, closeDialog] = useDialog()
  const { accountsSnapshot } = useSnapshot(balanceState)
  const formattedAmounts = useMemo(() => {
    const snapshotAccount = accountsSnapshot.find(
      (item) => item.assetCode === account.assetCode
    )

    const value = snapshotAccount?.balance || account.balance

    const amountScale2 = formatAmount({
      value: value,
      assetCode: account.assetCode,
      assetScale: account.assetScale
    })

    const amountScale9 = formatAmount({
      value: value,
      assetCode: account.assetCode,
      assetScale: 9
    })

    return {
      amountScale2: amountScale2,
      amountScale9: amountScale9
    }
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
      <div className="text-green items-center mt-6" id="balance">
        <h2 className="text-lg font-light md:text-xl">Balance</h2>
        <div className="text-2xl font-semibold md:text-4xl">
          {formattedAmounts.amountScale2.amount}
        </div>
        <div className="md:text-md text-sm font-light">
          {formattedAmounts.amountScale9.amount}
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
          <Link
            id="exchangeAsset"
            href={`/exchange?assetCode=${account.assetCode}&assetScale=${account.assetScale}&id=${account.id}`}
            className="group flex aspect-square h-24 w-24 flex-col items-center justify-center rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
          >
            <Exchange className="h-8 w-8" />
            <span className="font-medium text-green-5 group-hover:text-green-6">
              Exchange
            </span>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold leading-none text-green">
            Account
          </h3>
        </div>
        <div className="flex items-center justify-between rounded-md bg-gradient-primary px-3 py-2">
          <span className="font-semibold text-green">{account.name}</span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-lg font-bold mix-blend-screen">
            {formattedAmounts.amountScale2.symbol}
          </span>
        </div>
        <div className="flex flex-col">
          {allWalletAddresses.length > 0 ? (
            allWalletAddresses.map((walletAddress, index) => (
              <WalletAddressCard
                key={walletAddress.id}
                walletAddress={walletAddress}
                idOnboarding={
                  account.assetCode === 'USD' && index === 0
                    ? `viewTransactions`
                    : ''
                }
              />
            ))
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
  balance: FormattedAmount
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

  let balance = 0

  walletAddressesResponse.result.map((pp) => {
    pp.url = replaceWalletAddressProtocol(pp.url)
    balance += Number(pp.incomingBalance) - Number(pp.outgoingBalance)
  })

  return {
    props: {
      account: accountResponse.result,
      allWalletAddresses: walletAddressesResponse.result,
      balance: formatAmount({
        value: balance.toString(),
        assetCode: accountResponse.result.assetCode,
        assetScale: 9
      })
    }
  }
}

AccountPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default AccountPage
