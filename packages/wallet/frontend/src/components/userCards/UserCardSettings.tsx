import { useDialog } from '@/lib/hooks/useDialog'
import { Limit } from '../icons/Limit'
import { CardKey } from '../icons/Key'
import { UserCardSpendingLimitDialog } from '@/components/dialogs/UserCardSpendingLimitDialog'
import { UserCardPINDialog } from '@/components/dialogs/UserCardPINDialog'
import { useCardContext } from './UserCardContext'

export const UserCardSettings = () => {
  return (
    <ul role="list" className="space-y-2 pt-4 sm:pt-0">
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
        className="block w-full bg-green-light dark:bg-purple-bright rounded-md p-3 dark:hover:shadow-glow-button group"
      >
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green dark:bg-purple-dark rounded-full">
            <Limit className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900 group-hover:underline dark:group-hover:no-underline">
              Spending Limit
            </p>
            <p className="mt-1 text-grey-dark dark:text-white/70 truncate text-xs leading-5 text-gray-500 group-hover:underline dark:group-hover:no-underline">
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
        className="block w-full bg-green-light dark:bg-purple-bright rounded-md p-3 dark:hover:shadow-glow-button group"
      >
        <div className="flex min-w-0 gap-x-4">
          <div className="size-12 grid place-items-center bg-green dark:bg-purple-dark rounded-full">
            <CardKey className="text-white size-6" />
          </div>
          <div className="min-w-0 flex-auto text-left">
            <p className="font-semibold leading-6 text-gray-900 group-hover:underline dark:group-hover:no-underline">
              View Card PIN
            </p>
            <p className="mt-1 text-grey-dark dark:text-white/70 truncate text-xs leading-5 text-gray-500 group-hover:underline dark:group-hover:no-underline">
              Security
            </p>
          </div>
        </div>
      </button>
    </li>
  )
}
