import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { useCardContext } from './UserCardContext'
import { cardServiceMock } from '@/lib/api/card'
import { useRouter } from 'next/router'

export const FrozenCardActions = () => {
  const router = useRouter()

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="primary"
          aria-label="unfreeze"
          className="group"
          onClick={async () => {
            // Maybe use toats for showcasing the result of the api calls,
            // specifically for card actions?
            // We will probably have a lot more dialogs for card settings
            // and using dialogs again for showing the response might be a bit
            // cumbersome.
            const response = await cardServiceMock.unfreeze()

            if (!response.success) {
              console.error('[TODO] UPDATE ME - error while unfreezing card')
            }

            if (response.success) {
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
            // Maybe use toats for showcasing the result of the api calls,
            // specifically for card actions?
            // We will probably have a lot more dialogs for card settings
            // and using dialogs again for showing the response might be a bit
            // cumbersome.
            const response = await cardServiceMock.terminate()

            if (!response.success) {
              console.error('[TODO] UPDATE ME - error while terminating card')
            }

            if (response.success) {
              router.replace(router.asPath)
            }
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
  const { showDetails, setShowDetails } = useCardContext()

  return (
    <>
      <div className="flex flex-col gap-y-4">
        <Button
          intent="secondary"
          aria-label="freeze"
          className="group"
          onClick={async () => {
            // Maybe use toats for showcasing the result of the api calls,
            // specifically for card actions?
            // We will probably have a lot more dialogs for card settings
            // and using dialogs again for showing the response might be a bit
            // cumbersome.
            const response = await cardServiceMock.freeze()

            if (!response.success) {
              console.error('[TODO] UPDATE ME - error while freezing card')
            }

            if (response.success) {
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
