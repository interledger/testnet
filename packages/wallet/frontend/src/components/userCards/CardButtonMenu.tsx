import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { Dispatch, SetStateAction, useState } from 'react'
import { CardTypes } from '@/pages/card'
import { useDialog } from '@/lib/hooks/useDialog'
import { TerminateCardDialog } from '../dialogs/TerminateCardDialog'

export const CardButtonMenu = ({
  fn
}: {
  fn: Dispatch<SetStateAction<CardTypes>>
}) => {
  const [isDetailed, setIsDetailed] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const [openDialog, closeDialog] = useDialog()

  // ToDO revisit button layout shift, when clicking on butttons
  return (
    <div className="flex gap-x-3 justify-center items-center">
      <Button
        intent={isFrozen ? 'primary' : 'secondary'}
        aria-label="freeze"
        onClick={() => {
          setIsFrozen(!isFrozen)
          isFrozen ? fn('normal') : fn('frozen')
        }}
      >
        <div className="flex gap-2 justify-center items-center">
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
          <div className="flex gap-2 justify-center items-center">
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
        <Button
          intent="danger"
          aria-label="terminate"
          onClick={() => {
            openDialog(<TerminateCardDialog onClose={closeDialog} />)
          }}
        >
          <div className="flex gap-2 justify-center items-center">
            <Trash />
            Terminate
          </div>
        </Button>
      )}
    </div>
  )
}
