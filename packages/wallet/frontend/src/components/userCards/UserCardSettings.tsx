import { Limit } from '../icons/Limit'

export const UserCardSettings = () => {
  return (
    <div>
      <ul role="list" className="space-y-2">
        <SpendingLimit />
        <CardPIN />
      </ul>
    </div>
  )
}

const SpendingLimit = () => {
  return (
    <li className="shadow-md rounded-md">
      <button className="block w-full bg-green-light rounded-md p-3">
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green rounded-full">
            <Limit className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900">
              Spending Limit
            </p>
            <p className="mt-1 text-grey-dark truncate text-xs leading-5 text-gray-500">
              Monthly & Daily Limit
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}

const CardPIN = () => {
  return (
    <li className="shadow-md rounded-md">
      <button className="block w-full bg-green-light rounded-md p-3">
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green rounded-full">
            <Limit className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900">
              View Card PIN
            </p>
            <p className="mt-1 text-grey-dark truncate text-xs leading-5 text-gray-500">
              Security
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}
