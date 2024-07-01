import { CreateWalletAddressDialog } from '@/components/dialogs/CreateWalletAddressDialog'
import { FundAccountDialog } from '@/components/dialogs/FundAccountDialog'
import { New } from '@/components/icons/New'
import { AppLayout } from '@/components/layouts/AppLayout'
import { WalletAddressCard } from '@/components/cards/WalletAddressCard'
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
import { BackButton } from '@/components/BackButton'
import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { TemporaryWMNotice } from '@/components/TemporaryWMNotice'
import { PageHeader } from '@/components/PageHeader'
import { RequestMenu } from '@/components/icons/Request'
import { ListWalletAddressesResponse } from '@wallet/shared/src'

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
      <Tab.Group>
        <Tab.List>
          <div className="mb-8 flex items-center justify-between md:max-w-lg">
            {tabs.map((tab) => (
              <Tab
                key={tab}
                className="focus:outline focus:outline-1 focus:outline-black focus:dark:outline-none focus:dark:shadow-glow-button"
              >
                {({ selected }) => (
                  <div
                    className={cx(
                      'px-10 py-2 border-b-4 text-base sm:text-lg sm:leading-5',
                      selected ? 'bg-green-light dark:bg-purple-dark' : null
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
            <div className="mb-6">
              <h2 className="text-xl mb-2">Balance</h2>
              <p className="text-3xl font-bold">{formattedAmount.amount}</p>
            </div>
            <div className="md:max-w-lg flex gap-8 my-12">
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
                className="group hover:shadow-glow-button focus:shadow-glow-button duration-200 transition-[box-shadow] flex-grow-0 flex-shrink-0 basis-1/4 flex flex-col items-center justify-center aspect-square border-2 rounded-lg text-center min-w-28"
              >
                <New className="w-8 h-8 mb-1 transition-[filter] duration-200 group-focus:dark:drop-shadow-glow-svg group-hover:dark:drop-shadow-glow-svg" />
                <span className="group-focus:underline group-focus:underline-offset-2 group-hover:hover:underline underline-offset-2 text-[smaller] leading-4 text-center transition-transform group-hover:scale-110 group-focus:scale-110">
                  Add payment pointer
                </span>
              </button>
              <button
                id="fund"
                onClick={() => {
                  if (isUserFirstTime) {
                    setRunOnboarding(false)
                  }
                  openDialog(
                    <FundAccountDialog
                      account={account}
                      onClose={closeDialog}
                    />
                  )
                }}
                className="group hover:shadow-glow-button focus:shadow-glow-button duration-200 transition-[box-shadow] flex-grow-0 flex-shrink-0 basis-1/4 flex flex-col items-center justify-center aspect-square border-2 rounded-lg text-center min-w-28"
              >
                <RequestMenu className="w-8 h-8 mb-1 transition-[filter] duration-200 group-focus:dark:drop-shadow-glow-svg group-hover:dark:drop-shadow-glow-svg" />
                <span className="group-focus:underline group-focus:underline-offset-2 group-hover:hover:underline underline-offset-2 text-[smaller] leading-4 text-center transition-transform group-hover:scale-110 group-focus:scale-110">
                  Add money
                </span>
              </button>
            </div>
            <h2 className="mb-2 text-2xl font-bold">Payment Pointers</h2>
            <div className="overflow-x-auto">
              <table className="min-w-[35rem] border-collapse">
                <tbody>
                  {allWalletAddresses.walletAddresses.length > 0
                    ? allWalletAddresses.walletAddresses.map(
                        (walletAddress) => (
                          <tr
                            className="[&>td]:p-4 [&>td]:border-b [&>td]:border-pink-neon"
                            key={walletAddress.id}
                          >
                            <td>{walletAddress.url}</td>
                            <td>View</td>
                            <td>Actions</td>
                          </tr>
                        )
                      )
                    : null}
                </tbody>
              </table>
            </div>
            <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold leading-none text-green">
                  Payment Pointers
                </h3>
              </div>
              <div className="flex flex-col">
                {allWalletAddresses.walletAddresses.length > 0 ? (
                  allWalletAddresses.walletAddresses.map(
                    (walletAddress, index) => (
                      <WalletAddressCard
                        key={walletAddress.id}
                        walletAddress={walletAddress}
                        isWM={false}
                        idOnboarding={
                          account.assetCode === 'EUR' && index === 0
                            ? `viewTransactions`
                            : ''
                        }
                      />
                    )
                  )
                ) : (
                  <div className="flex items-center justify-center p-4 text-green">
                    <span>No payment pointers found for this account.</span>
                  </div>
                )}
              </div>
            </div>
          </Tab.Panel>
          <Tab.Panel>
            {account.assetCode === 'USD' ? (
              <>
                <div className="flex items-center">
                  <BackButton />
                  <div className="text-green" id="balance">
                    <h2 className="text-lg font-light md:text-xl">Balance</h2>
                    <p className="text-2xl font-semibold md:text-4xl">
                      {balance.amount}
                    </p>
                  </div>
                </div>
                <div className="my-10">
                  <button
                    id="walletAddressWM"
                    onClick={() => {
                      openDialog(
                        <CreateWalletAddressDialog
                          accountName={account.name}
                          isWebMonetization={true}
                          onClose={closeDialog}
                        />
                      )
                    }}
                    className="group flex aspect-square h-24 w-24 flex-col items-center justify-center -space-y-1 rounded-lg border border-green-5 bg-white shadow-md hover:border-green-6"
                  >
                    <New className="h-9 w-7" />
                    <div className="-space-y-2 text-[15px]">
                      <p className="font-medium text-green-5 group-hover:text-green-6">
                        Add WM{' '}
                      </p>
                      <p className="font-medium text-green-5 group-hover:text-green-6">
                        payment{' '}
                      </p>
                      <p className="font-medium text-green-5 group-hover:text-green-6">
                        pointer
                      </p>
                    </div>
                  </button>
                </div>
                <div className="mt-5 flex w-full flex-col space-y-5 md:max-w-md">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold leading-none text-green">
                      Account
                    </h3>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-gradient-primary px-3 py-2">
                    <span className="font-semibold text-green">
                      {account.name}
                    </span>
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white text-lg font-bold mix-blend-screen">
                      {formattedAmount.symbol}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    {allWalletAddresses.wmWalletAddresses.length > 0 ? (
                      allWalletAddresses.wmWalletAddresses.map(
                        (walletAddress) => (
                          <WalletAddressCard
                            key={walletAddress.id}
                            walletAddress={walletAddress}
                            isWM={true}
                          />
                        )
                      )
                    ) : (
                      <div className="flex items-center justify-center p-4 text-green">
                        <span>
                          No web monetization payment pointers found for this
                          account.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
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
