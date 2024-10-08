import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { useCardContext } from './UserCardContext'
import { cardService } from '@/lib/api/card'
import { useRouter } from 'next/router'
import { useToast } from '@/lib/hooks/useToast'
import { useDialog } from '@/lib/hooks/useDialog'
import { TerminateCardDialog } from '../dialogs/TerminateCardDialog'

export const FrozenCardActions = () => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()
  const { card } = useCardContext()
  const { toast } = useToast()

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
                description: (
                  <p>
                    An error occured while unfreezing the card. Please try
                    again.
                  </p>
                ),
                variant: 'error'
              })
            }

            if (response.success) {
              router.replace(router.asPath)
              toast({
                description: <p>Card is no longer frozen.</p>,
                variant: 'success'
              })
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
            openDialog(<TerminateCardDialog onClose={closeDialog} />)
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
  const { card, showDetails, setShowDetails } = useCardContext()
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
                description: (
                  <p>
                    An error occured while freezing the card. Please try again.
                  </p>
                ),
                variant: 'error'
              })
            }

            if (response.success) {
              router.replace(router.asPath)
              toast({
                description: <p>Card is frozen.</p>,
                variant: 'success'
              })
            }
          }}
        >
          <div className="flex gap-2 justify-center items-center group-hover:drop-shadow-glow-svg-green dark:group-hover:drop-shadow-none">
            <Snow className="size-6" />
          </div>
        </Button>
        <p className="text-center text-sm">Freeze</p>
      </div>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="secondary"
          aria-label={showDetails ? 'hide details' : 'show details'}
          className="group"
          onClick={() => setShowDetails((prev) => !prev)}
        >
          <div className="flex gap-2 justify-center items-center group-hover:drop-shadow-glow-svg-green dark:group-hover:drop-shadow-none">
            {showDetails ? (
              <EyeCross className="size-6" />
            ) : (
              <Eye className="size-6" />
            )}
          </div>
        </Button>
        <p className="text-center text-sm">
          {showDetails ? 'Hide Details' : 'Details'}
        </p>
      </div>
    </>
  )
}

export const UserCardActions = () => {
  const { card } = useCardContext()

  return (
    <div className="grid grid-cols-2 gap-x-3">
      {card.status === 'TemporaryBlocked' ? (
        <FrozenCardActions />
      ) : (
        <DefaultCardActions />
      )}
    </div>
  )
}
