import { Link } from '@/ui/Link'
import type { Account } from '@/lib/api/account'
import { formatAmount } from '@/utils/helpers'
import { useMemo } from 'react'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { balanceState } from '@/lib/balance'
import { useSnapshot } from 'valtio'

type AccountCardProps = {
  account: Account
  idOnboarding?: string
}

export const AccountCard = ({ account, idOnboarding }: AccountCardProps) => {
  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()
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

  return (
    <Link
      id={idOnboarding}
      href={`account/${account.id}`}
      // prettier-ignore
      className={`text-right ease-in-out transition-[box-shadow,transform,] duration-200 aspect-[5/3] rounded-lg flex flex-col p-3 border-2
          hover:scale-105 focus:scale-105
          hover:dark:shadow-glow-link focus:dark:shadow-glow-link
          [&:nth-child(4n+2)]:border-green-dark [&:nth-child(4n+3)]:border-pink-dark [&:nth-child(4n+4)]:border-orange-dark [&:nth-child(4n+5)]:border-purple-bright 
          dark:[&:nth-child(4n+2)]:border-pink-neon dark:[&:nth-child(4n+3)]:border-teal-neon dark:[&:nth-child(4n+4)]:border-yellow-neon dark:[&:nth-child(4n+5)]:border-green-neon
          dark:[&:nth-child(4n+2)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--pink-neon)),_0_0_.4rem_rgb(var(--pink-neon)),_inset_0_0_.6rem_rgb(var(--pink-neon))]
          dark:[&:nth-child(4n+3)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--teal-neon)),_0_0_.4rem_rgb(var(--teal-neon)),_inset_0_0_.6rem_rgb(var(--teal-neon))]
          dark:[&:nth-child(4n+4)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--yellow-neon)),_0_0_.4rem_rgb(var(--yellow-neon)),_inset_0_0_.6rem_rgb(var(--yellow-neon))]
          dark:[&:nth-child(4n+5)]:[--tw-shadow:0_0_.2rem_rgb(var(--white)),_0_0_.2rem_rgb(var(--white)),_0_0_1rem_rgb(var(--green-neon)),_0_0_.4rem_rgb(var(--green-neon)),_inset_0_0_.6rem_rgb(var(--green-neon))]
          hover:dark:[&:nth-child(4n+2)]:border-white hover:dark:[&:nth-child(4n+3)]:border-white hover:dark:[&:nth-child(4n+4)]:border-white hover:dark:[&:nth-child(4n+5)]:border-white
          focus:dark:[&:nth-child(4n+2)]:border-white focus:dark:[&:nth-child(4n+3)]:border-white focus:dark:[&:nth-child(4n+4)]:border-white focus:dark:[&:nth-child(4n+5)]:border-white
          [&:nth-child(4n+2)]:[--accent:rgb(var(--green-dark))] [&:nth-child(4n+3)]:[--accent:rgb(var(--pink-dark))] [&:nth-child(4n+4)]:[--accent:rgb(var(--orange-dark))] [&:nth-child(4n+5)]:[--accent:rgb(var(--purple-bright))]
          dark:[&:nth-child(4n+2)]:[--accent:rgb(var(--pink-light))] dark:[&:nth-child(4n+3)]:[--accent:rgb(var(--teal-light))] dark:[&:nth-child(4n+4)]:[--accent:rgb(var(--yellow-light))] dark:[&:nth-child(4n+5)]:[--accent:rgb(var(--green-bright))]`}
      onClick={() => {
        if (isUserFirstTime) {
          setRunOnboarding(false)
        }
      }}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[--accent] text-xl text-white dark:text-purple">
        {formattedAmount.symbol}
      </span>
      <span className="mt-auto hidden overflow-hidden text-ellipsis whitespace-nowrap leading-4 text-[--accent] sm:block">
        {account.name}
      </span>
      <span className="text-md mt-auto font-semibold -tracking-wider text-[--accent] sm:text-2xl">
        {formattedAmount.amount}
      </span>
    </Link>
  )
}
