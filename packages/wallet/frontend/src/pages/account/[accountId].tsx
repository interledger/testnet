import { CreateWalletAddressDialog } from '@/components/dialogs/CreateWalletAddressDialog'
import { New } from '@/components/icons/New'
import { AppLayout } from '@/components/layouts/AppLayout'
import { Account, accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
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
import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { TemporaryWMNotice } from '@/components/TemporaryWMNotice'
import { PageHeader } from '@/components/PageHeader'
import { Request } from '@/components/icons/Request'
import { ListWalletAddressesResponse } from '@wallet/shared/src'
import { WalletAddressesTable } from '@/components/WalletAddressesTable'
import { WithdrawFundsDialog } from '@/components/dialogs/WithdrawFundsDialog'
import { Withdraw } from '@/components/icons/Withdraw'
import { Link } from '@/ui/Link'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const tabs = ['Account', 'Web Monetization']

const AccountPage: NextPageWithLayout<AccountPageProps> = ({
  account,
  allWalletAddresses,
  balance
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
      setStepIndex(stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader title={account.name} />
      <Tab.Group>
        <Tab.List>
          <div className="mb-8 flex items-center justify-between md:max-w-lg">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className="hover:outline hover:outline-1 hover:outline-black focus:outline focus:outline-1 focus:outline-black hover:dark:shadow-glow-button hover:dark:outline-none focus:dark:shadow-glow-button focus:dark:outline-none"
              >
                {({ selected }) => (
                  <div
                    className={cx(
                      'border-b-4 px-10 py-2 text-base sm:text-lg sm:leading-5',
                      selected
                        ? 'bg-green-light dark:bg-purple-dark'
                        : 'hover:bg-green-light hover:dark:bg-purple-dark'
                    )}
                  >
                    {tab}
                  </div>
                )}
              </Tab>
            ))}
          </div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div className="mb-6" id="balance">
              <h2 className="mb-2 text-xl">Balance</h2>
              <p className="text-3xl font-bold">{formattedAmount.amount}</p>
            </div>
            <div className="my-12 flex gap-8 md:max-w-lg">
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
                  Add payment pointer
                </span>
              </button>
              <Link
                id="fund"
                href="/deposit"
                className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
              >
                <Request className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
                <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
                  Deposit
                </span>
              </Link>
              <button
                id="withdraw"
                onClick={() => {
                  openDialog(
                    <WithdrawFundsDialog
                      account={account}
                      onClose={closeDialog}
                    />
                  )
                }}
                className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
              >
                <Withdraw className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
                <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2 dark:group-hover:decoration-transparent">
                  Withdraw
                </span>
              </button>
            </div>
            <h2 className="mb-2 text-2xl font-bold">Payment Pointers</h2>
            {allWalletAddresses.walletAddresses.length > 0 ? (
              <WalletAddressesTable
                account={account}
                walletAddresses={allWalletAddresses.walletAddresses}
                isWM={false}
              />
            ) : (
              <div className="p-4">
                No payment pointers found for this account.
              </div>
            )}
          </Tab.Panel>
          <Tab.Panel>
            {account.assetCode === 'USD' ? (
              <>
                <div className="mb-6">
                  <h2 className="mb-2 text-xl">Balance</h2>
                  <p className="text-3xl font-bold">{balance.amount}</p>
                </div>
                <div className="my-12 flex gap-8 md:max-w-lg">
                  <button
                    onClick={() => {
                      openDialog(
                        <CreateWalletAddressDialog
                          accountName={account.name}
                          isWebMonetization={true}
                          onClose={closeDialog}
                        />
                      )
                    }}
                    className="group flex aspect-square min-w-28 flex-shrink-0 flex-grow-0 basis-1/4 flex-col items-center justify-center rounded-lg border-2 text-center transition-[box-shadow] duration-200 dark:hover:shadow-glow-button dark:focus:shadow-glow-button"
                  >
                    <New className="mb-1 h-8 w-8 transition-[filter] duration-200 group-hover:dark:drop-shadow-glow-svg group-focus:dark:drop-shadow-glow-svg" />
                    <span className="text-center text-[smaller] leading-4 underline-offset-2 transition-transform group-hover:scale-110 group-hover:hover:underline group-focus:scale-110 group-focus:underline group-focus:underline-offset-2">
                      Add WM payment pointer
                    </span>
                  </button>
                </div>
                <h2 className="mb-2 text-2xl font-bold">Payment Pointers</h2>
                {allWalletAddresses.wmWalletAddresses.length > 0 ? (
                  <WalletAddressesTable
                    account={account}
                    walletAddresses={allWalletAddresses.wmWalletAddresses}
                    isWM={true}
                  />
                ) : (
                  <div className="p-4">
                    No Web Monetization payment pointers found for this account.
                  </div>
                )}
              </>
            ) : (
              <TemporaryWMNotice />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </>
  )
}

const querySchema = z.object({
  accountId: z.string().uuid()
})

export const getServerSideProps: GetServerSideProps<{
  account: Account
  allWalletAddresses: ListWalletAddressesResponse
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

  walletAddressesResponse.result.walletAddresses.map((pp) => {
    pp.url = replaceWalletAddressProtocol(pp.url)
  })
  walletAddressesResponse.result.wmWalletAddresses.map((pp) => {
    pp.url = replaceWalletAddressProtocol(pp.url)
    balance += Number(pp.incomingBalance)
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
