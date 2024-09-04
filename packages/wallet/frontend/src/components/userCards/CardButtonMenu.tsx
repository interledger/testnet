import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { Dispatch, SetStateAction, useState } from 'react'
import { CardTypes } from '@/pages/card'
import { ActivateCardDialog } from '../dialogs/ActivateCardDialog'
import { useDialog } from '@/lib/hooks/useDialog'

type CardButtonMenuProps = {
  fn: Dispatch<SetStateAction<CardTypes>>
  isActive: boolean
}

export const CardButtonMenu = ({ fn, isActive }: CardButtonMenuProps) => {
  const [isDetailed, setIsDetailed] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [openDialog, closeDialog] = useDialog()

  // ToDO revisit button layout shift, when clicking on buttons
  return (
    <div className="flex gap-x-3 justify-center items-center">
      {isActive ? (
        <>
          <Button
            intent={isFrozen ? 'primary' : 'secondary'}
            aria-label="freeze"
            onClick={() => {
              setIsFrozen(!isFrozen)
              isFrozen ? fn('normal') : fn('frozen')
            }}
          >
            <div className="flex gap-x-2 justify-center items-center">
              <Snow />
              {isFrozen ? 'Unfreeze' : 'Freeze'}
            </div>
          </Button>
          {!isFrozen ? (
            <Button
              aria-label="details"
              intent={isDetailed ? 'primary' : 'secondary'}
              onClick={() => {
                setIsDetailed(!isDetailed)
                isDetailed ? fn('normal') : fn('details')
              }}
            >
              <div className="flex gap-x-2 justify-center items-center">
                {isDetailed ? (
                  <>
                    <EyeCross />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye />
                    Details
                  </>
                )}
              </div>
            </Button>
          ) : (
            <Button intent="danger" aria-label="terminate">
              <div className="flex gap-2 justify-center items-center">
                <Trash />
                Terminate
              </div>
            </Button>
          )}
        </>
      ) : (
        <Button
          intent="primary"
          aria-label="activate"
          onClick={() => {
            openDialog(<ActivateCardDialog onClose={closeDialog} />)
          }}
        >
          Activate Card
        </Button>
      )}
    </div>
  )
}
