import { Link } from '@/ui/Link'
import type { Account } from '@/lib/api/account'

type AccountCardProps = {
  account: Account
}

export const AccountCard = ({ account }: AccountCardProps) => {
  return (
    <Link
      href={`account/${account.id}`}
      className={`
        rounded-lg shadow-sm transition-transform hover:scale-105 hover:shadow-md
        [&:nth-child(4n+1)]:bg-gradient-primary 
        [&:nth-child(4n+2)]:bg-gradient-violet 
        [&:nth-child(4n+3)]:bg-gradient-pink
        [&:nth-child(4n+4)]:bg-gradient-orange`}
    >
      <div className="flex aspect-square flex-1 flex-col p-2">
        <span className="inline-flex h-8 w-14 items-center justify-center rounded-md bg-white text-2xl font-semibold mix-blend-screen">
          {account.assetCode}
        </span>
        <div className="mt-auto text-white">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-light">
            {account.name}
          </p>
          {/* TODO: Replace with the actual account balance */}
          <p className="text-2xl font-semibold tracking-tighter">{0}</p>
        </div>
      </div>
    </Link>
  )
}
