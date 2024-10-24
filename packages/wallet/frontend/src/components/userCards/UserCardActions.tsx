import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import {
  ICardData,
  isLockedCard,
  useCardContext,
  useKeysContext
} from './UserCardContext'
import { cardService } from '@/lib/api/card'
import { useRouter } from 'next/router'
import { useToast } from '@/lib/hooks/useToast'
import NodeRSA from 'node-rsa'
import { useDialog } from '@/lib/hooks/useDialog'
import { TerminateCardDialog } from '../dialogs/TerminateCardDialog'
import { PasswordDialog } from '../dialogs/PasswordDialog'

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
  const [openDialog, closeDialog] = useDialog()
  const { card, showDetails, setShowDetails, setCardData } = useCardContext()
  const { keys } = useKeysContext()
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
              setCardData(null)
              setShowDetails(false)
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
          onClick={async () => {
            if (showDetails) {
              setShowDetails(false)
              setCardData(null)
              return
            }
            openDialog(
              <PasswordDialog
                title="View card details"
                onClose={closeDialog}
                onSubmit={async (password: string) => {
                  if (!keys) {
                    await router.replace(router.pathname)
                    return
                  }

                  const response = await cardService.getCardData(card.id, {
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
                      description:
                        'Could not fetch card details. Please try again',
                      variant: 'error'
                    })
                    return
                  }

                  closeDialog()

                  // TODO: Move this to SubtleCrypto
                  const privateKey = new NodeRSA(keys.privateKey)
                  privateKey.setOptions({
                    encryptionScheme: 'pkcs1',
                    environment: 'browser'
                  })

                  const decryptedRequestData = privateKey
                    .decrypt(response.result.cypher)
                    .toString('utf8')

                  const cardData = JSON.parse(decryptedRequestData) as ICardData
                  cardData.Pan = formatCardPan(cardData.Pan)

                  setCardData(cardData)

                  setShowDetails(true)
                }}
              />
            )
          }}
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
  const isLocked = isLockedCard(card)

  return (
    <div className="grid grid-cols-2 gap-x-3">
      {isLocked ? <FrozenCardActions /> : <DefaultCardActions />}
    </div>
  )
}

function formatCardPan(pan: string): string {
  return pan.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}
