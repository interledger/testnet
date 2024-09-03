import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { useState } from 'react'
import { useCardContext } from '@/lib/context/card'

export const CardButtonMenu = () => {
  const [isDetailed, setIsDetailed] = useState(false)
  const [isFrozen, setIsFrozen] = useState(false)
  const { setCardType } = useCardContext()

  return (
    <div className="flex gap-3 items-center flex-row">
      <Button
        intent={isFrozen ? 'primary' : 'secondary'}
        aria-label="freeze"
        onClick={() => {
          setIsFrozen(!isFrozen)
          isFrozen ? setCardType('normal') : setCardType('frozen')
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
            isDetailed ? setCardType('normal') : setCardType('details')
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
