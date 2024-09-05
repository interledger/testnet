import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { Dispatch, SetStateAction, useState } from 'react'
import type { CardType } from './UserCard'

interface CardActionsProps {
  fn: Dispatch<SetStateAction<CardType>>
}

// TODO: Better naming for the function
export const CardActions = ({
  fn
}: CardActionsProps) => {
  const [isDetailed, setIsDetailed] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)

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
        <Button intent="danger" aria-label="terminate">
          <div className="flex gap-2 justify-center items-center">
            <Trash />
            Terminate
          </div>
        </Button>
      )}
    </div>
  )
}
