import { Button } from '@/ui/Button'
import { Eye, EyeCross, Snow, Trash } from '../icons/CardButtons'
import { Dispatch, SetStateAction, useState } from 'react'

interface CardActionsProps {
  fn: Dispatch<SetStateAction<boolean>>
  isFrozen: boolean
}

// TODO: Better naming for the function
export const CardActions = ({ fn, isFrozen }: CardActionsProps) => {
  // ToDO revisit button layout shift, when clicking on butttons
  return (
    <div className="flex gap-x-3 justify-center items-center">
      <div className="flex flex-col gap-y-4">
        <Button
          intent={isFrozen ? 'primary' : 'secondary'}
          aria-label={isFrozen ? 'unfreeze' : 'freeze'}
          onClick={() => {
            // API Call
          }}
        >
          <div className="flex gap-2 justify-center items-center">
            <Snow />
          </div>
        </Button>
        {isFrozen ? 'Unfreeze' : 'Freeze'}
      </div>
      {!isFrozen ? (
        <div className="flex flex-col gap-y-4">
          <Button
            intent={isFrozen ? 'primary' : 'secondary'}
            aria-label={isFrozen ? 'unfreeze' : 'freeze'}
            onClick={() => {
              // API Call
            }}
          >
            <div className="flex gap-2 justify-center items-center">
              <Snow />
            </div>
          </Button>
          {isFrozen ? 'Unfreeze' : 'Freeze'}
        </div>
      ) : null}
    </div>
  )
}

// {!isFrozen ? (
//   <Button
//     aria-label="details"
//     intent={isDetailed ? 'primary' : 'secondary'}
//     onClick={() => {
//       setIsDetailed(!isDetailed)
//       isDetailed ? fn('normal') : fn('details')
//     }}
//   >
//     <div className="flex gap-2 justify-center items-center">
//       {isDetailed ? (
//         <>
//           <EyeCross />
//           Hide Details
//         </>
//       ) : (
//         <>
//           <Eye />
//           Details
//         </>
//       )}
//     </div>
//   </Button>
// ) : (
//   <Button intent="danger" aria-label="terminate">
//     <div className="flex gap-2 justify-center items-center">
//       <Trash />
//       Terminate
//     </div>
//   </Button>
// )}
