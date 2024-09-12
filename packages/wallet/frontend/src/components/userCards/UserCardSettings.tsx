import { useDialog } from '@/lib/hooks/useDialog'
import { Limit } from '../icons/Limit'
import { UserCardSpendingLimitDialog } from '@/components/dialogs/UserCardSpendingLimitDialog'
import { UserCardPINDialog } from '@/components/dialogs/UserCardPINDialog'
import { useCardContext } from './UserCardContext'

export const UserCardSettings = () => {
  return (
    <ul role="list" className="space-y-2">
      <SpendingLimit />
      <PinSettings />
    </ul>
  )
}

const SpendingLimit = () => {
  const [openDialog, closeDialog] = useDialog()

  return (
    <li className="shadow-md rounded-md">
      <button
        onClick={() => {
          openDialog(<UserCardSpendingLimitDialog onClose={closeDialog} />)
        }}
        className="block w-full bg-green-light dark:bg-purple-bright rounded-md p-3"
      >
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green dark:bg-purple-dark rounded-full">
            <Limit className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900">
              Spending Limit
            </p>
            <p className="mt-1 text-grey-dark dark:text-white/70 truncate text-xs leading-5 text-gray-500">
              Monthly & Daily Limit
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}

const PinSettings = () => {
  const { card } = useCardContext()
  const [openDialog, closeDialog] = useDialog()

  return (
    <li className="shadow-md rounded-md">
      <button
        onClick={() => {
          openDialog(<UserCardPINDialog card={card} onClose={closeDialog} />)
        }}
        className="block w-full bg-green-light dark:bg-purple-bright rounded-md p-3"
      >
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green dark:bg-purple-dark rounded-full">
            <Limit className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900">
              View Card PIN
            </p>
            <p className="mt-1 text-grey-dark dark:text-white/70 truncate text-xs leading-5 text-gray-500">
              Security
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}
