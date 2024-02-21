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
import {
  ListWalletAddresses,
  walletAddressService
} from '@/lib/api/walletAddress'
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
import { BackButton } from '@/components/BackButton'
import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { TemporaryWMNotice } from '@/components/TemporaryWMNotice'

type AccountPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

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
      <Tab.Group>
        <Tab.List>
          <div className="my-5 flex flex-row items-center justify-between p-1 md:max-w-lg">
            <Tab className="focus:outline-none">
              {({ selected }) => (
                <div
                  className={cx(
                    'group relative px-10 py-2.5 text-center text-lg font-medium leading-5',
                    selected ? 'text-green' : 'text-green-3 hover:text-green'
                  )}
                >
                  Account
                  <div
                    className={cx(
                      'absolute inset-x-0 bottom-0 h-1 rounded-full',
                      selected
                        ? 'bg-green'
                        : 'bg-gradient-primary group-hover:bg-gradient-to-r group-hover:from-green group-hover:to-green'
                    )}
                  />
                </div>
              )}
            </Tab>
            <Tab className="focus:outline-none">
              {({ selected }) => (
                <div
                  className={cx(
                    'group relative px-10 py-2.5 text-center text-lg font-medium leading-5',
                    selected ? 'text-green' : 'text-green-3 hover:text-green'
                  )}
                >
                  Web Monetization
                  <div
                    className={cx(
                      'absolute inset-x-0 bottom-0 h-1 rounded-full',
                      selected
                        ? 'bg-green'
                        : 'bg-gradient-primary group-hover:bg-gradient-to-r group-hover:from-green group-hover:to-green'
                    )}
                  />
                </div>
              )}
            </Tab>
          </div>
        </Tab.List>
        <Tab.Panels>
          <Tab.Panel>
            <div className="flex items-center">
              <BackButton />
              <div className="text-green" id="balance">
                <h2 className="text-lg font-light md:text-xl">Balance</h2>
                <p className="text-2xl font-semibold md:text-4xl">
                  {formattedAmount.amount}
                </p>
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
                      <FundAccountDialog
                        account={account}
                        onClose={closeDialog}
                      />
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
                      <WithdrawFundsDialog
                        account={account}
                        onClose={closeDialog}
                      />
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
                  {formattedAmount.symbol}
                </span>
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
                          account.assetCode === 'USD' && index === 0
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
                        (walletAddress, index) => (
                          <WalletAddressCard
                            key={walletAddress.id}
                            walletAddress={walletAddress}
                            isWM={true}
                            idOnboarding={
                              account.assetCode === 'USD' && index === 0
                                ? `viewTransactions`
                                : ''
                            }
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
  allWalletAddresses: ListWalletAddresses
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
