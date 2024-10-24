import { useDialog } from '@/lib/hooks/useDialog'
import { Limit } from '../icons/Limit'
import { CardKey } from '../icons/Key'
import { UserCardSpendingLimitDialog } from '@/components/dialogs/UserCardSpendingLimitDialog'
import { UserCardPINDialog } from '@/components/dialogs/UserCardPINDialog'
import { PasswordDialog } from '@/components/dialogs/PasswordDialog'
import { useCardContext, useKeysContext } from './UserCardContext'
import { cardService } from '@/lib/api/card'
import { useToast } from '@/lib/hooks/useToast'
import NodeRSA from 'node-rsa'

export const UserCardSettings = () => {
  return (
    <ul role="list" className="space-y-2 pt-4 lg:pt-0">
      <PinSettings />
    </ul>
  )
}

// Unused at the moment
export const SpendingLimit = () => {
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
  const { keys } = useKeysContext()
  const { toast } = useToast()
  const [openDialog, closeDialog] = useDialog()

  if (!keys) return null

  return (
    <li className="shadow-md rounded-md max-w-80 mx-auto">
      <button
        onClick={() => {
          openDialog(
            <PasswordDialog
              title="View card PIN"
              onClose={closeDialog}
              onSubmit={async (password: string) => {
                const response = await cardService.getPin(card.id, {
                  password,
                  publicKeyBase64: keys.publicKey
                })

                if (!response.success) {
                  toast({
                    description: response.message,
                    variant: 'error'
                  })
                  return
                }

                if (!response.result) {
                  toast({
                    description: 'Could not fetch card PIN. Please try again',
                    variant: 'error'
                  })
                  return
                }

                // TODO: Move this to SubtleCrypto
                const privateKey = new NodeRSA(keys.privateKey)
                privateKey.setOptions({
                  encryptionScheme: 'pkcs1',
                  environment: 'browser'
                })

                const pin = privateKey
                  .decrypt(response.result.cypher)
                  .toString('utf8')

                openDialog(
                  <UserCardPINDialog
                    card={card}
                    pin={pin}
                    onClose={closeDialog}
                  />
                )
              }}
            />
          )
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
