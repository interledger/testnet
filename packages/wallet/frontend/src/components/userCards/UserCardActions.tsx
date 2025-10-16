import { Button } from '@/ui/Button'
import { Snow, Trash } from '../icons/CardButtons'
import { isLockedCard, useCardContext } from './UserCardContext'
import { cardService } from '@/lib/api/card'
import { useRouter } from 'next/router'
import { useToast } from '@/lib/hooks/useToast'
import { useDialog } from '@/lib/hooks/useDialog'
import { TerminateCardDialog } from '../dialogs/TerminateCardDialog'

export const FrozenCardActions = () => {
  const router = useRouter()
  const { card } = useCardContext()
  const { toast } = useToast()
  const [openDialog, closeDialog] = useDialog()

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="primary"
          aria-label="unfreeze"
          className="group"
          onClick={async () => {
            const response = await cardService.unfreeze(card.id)

            if (!response.success) {
              toast({
                description: 'Could not unfreeze card. Please try again',
                variant: 'error'
              })
              console.error(response.message)
              return
            }

            if (response.success) {
              toast({
                description: 'Card was successfully unfrozen.',
                variant: 'success'
              })
              router.replace(router.asPath)
            }
          }}
        >
          <div className="flex gap-2 justify-center items-center group-hover:drop-shadow-glow-svg-green dark:group-hover:drop-shadow-none">
            <Snow className="size-6" />
          </div>
        </Button>
        <p className="text-center text-sm">Unfreeze</p>
      </div>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="danger"
          aria-label="terminate card"
          className="group"
          onClick={async () => {
            openDialog(
              <TerminateCardDialog onClose={closeDialog} card={card} />
            )
          }}
        >
          <div className="flex gap-2 justify-center items-center group-hover:drop-shadow-glow-svg-orange dark:group-hover:drop-shadow-none">
            <Trash className="size-6" />
          </div>
        </Button>
        <p className="text-center text-sm">Terminate</p>
      </div>
    </>
  )
}

const DefaultCardActions = () => {
  const router = useRouter()
  const { card } = useCardContext()
  const { toast } = useToast()

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="secondary"
          aria-label="freeze"
          className="group"
          onClick={async () => {
            const response = await cardService.freeze(card.id)

            if (!response.success) {
              toast({
                description: 'Could not freeze card. Please try again',
                variant: 'error'
              })
              console.error(response.message)
              return
            }

            if (response.success) {
              toast({
                description: 'Card was successfully frozen.',
                variant: 'success'
              })

              router.replace(router.asPath)
            }
          }}
        >
          <div className="flex gap-2 justify-center items-center group-hover:drop-shadow-glow-svg-green dark:group-hover:drop-shadow-none">
            <Snow className="size-6" />
          </div>
        </Button>
        <p className="text-center text-sm">Freeze</p>
      </div>
    </>
  )
}

export const UserCardActions = () => {
  const { card } = useCardContext()
  const isLocked = isLockedCard(card)
  return (
    <div className="grid grid-cols-2 gap-x-3">
      {isLocked ? <FrozenCardActions /> : <DefaultCardActions />}
    </div>
  )
}
