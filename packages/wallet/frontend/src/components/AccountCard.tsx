import { Link } from '@/ui/Link'
import type { Account } from '@/lib/api/account'
import { formatAmount } from '@/utils/helpers'
import { useMemo } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'

type AccountCardProps = {
  account: Account
  idOnboarding?: string
}

export const AccountCard = ({ account, idOnboarding }: AccountCardProps) => {
  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()

  const formattedAmount = useMemo(
    () =>
      formatAmount({
        value: account.balance,
        assetCode: account.assetCode,
        assetScale: account.assetScale
      }),
    [account]
  )

  return (
    <Link
      href={`account/${account.id}`}
      className={`
        rounded-lg shadow-sm transition-transform hover:scale-105 hover:shadow-md
        [&:nth-child(4n+1)]:bg-gradient-primary 
        [&:nth-child(4n+2)]:bg-gradient-violet 
        [&:nth-child(4n+3)]:bg-gradient-pink
        [&:nth-child(4n+4)]:bg-gradient-orange`}
      onClick={() => {
        if (isUserFirstTime) {
          setRunOnboarding(false)
        }
      }}
    >
      <div className="flex aspect-square flex-1 flex-col p-2" id={idOnboarding}>
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-white text-xl font-semibold mix-blend-screen">
          {formattedAmount.symbol}
        </span>
        <div className="mt-auto text-white">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-light">
            {account.name}
          </p>

          <p className="text-2xl font-semibold tracking-tighter">
            {formattedAmount.amount}
          </p>
        </div>
      </div>
    </Link>
  )
}
