type AccountCardProps = {
  asset: string
  name: string
  balance: number
}

export const AccountCard = ({ asset, name, balance }: AccountCardProps) => {
  return (
    <div className="flex aspect-square flex-col">
      <div className="flex flex-1 flex-col p-2">
        <div className="flex flex-1 text-2xl font-semibold">
          <span className="inline-flex h-8 w-14 items-center justify-center rounded-md bg-white mix-blend-screen">
            {asset}
          </span>
        </div>
        <div className="mt-auto text-white">
          <p className="overflow-hidden text-ellipsis whitespace-nowrap font-light">
            {name}
          </p>
          <p className="text-2xl font-semibold tracking-tighter">{balance}</p>
        </div>
      </div>
    </div>
  )
}
