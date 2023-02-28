import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside'
import { Button } from '@/ui/Button'

import { IconButton } from '@/ui/IconButton'
import {
  ComponentPropsWithoutRef,
  createRef,
  forwardRef,
  useEffect,
  useRef,
  useState
} from 'react'
import { PencilSquare } from './icons/Pencil'

type PaymentPointerCardProps = {
  paymentPointer: {
    id: string
    url: string
  }
}

const PaymentPointerInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>((props, ref) => {
  return (
    <div className="flex items-center rounded-md bg-green-4">
      <span className="border-green px-1 text-green">$rafiki.money/</span>
      <input
        className="border-b-violet underline outline-none"
        defaultValue={'test'}
        ref={ref}
      />
    </div>
  )
})

PaymentPointerInput.displayName = 'PaymentPointerInput'

export const PaymentPointerCard = ({
  paymentPointer
}: PaymentPointerCardProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const inputRef = createRef<HTMLInputElement>()

  useOnClickOutside(inputRef, () => setIsEditing((prev) => !prev))
  useEffect(() => {
    inputRef.current?.focus()
  }, [inputRef])

  return (
    <div className="flex items-center justify-between rounded-md px-2 py-3 shadow-md shadow-green-4 hover:shadow-green-6">
      <div className="flex items-center space-x-2">
        <IconButton
          onClick={() => {
            setIsEditing(true)
          }}
          aria-label="edit payment pointer"
          className="h-6 w-6 text-green-7 transition-transform duration-75 hover:scale-[115%] hover:text-green-3"
        >
          <PencilSquare />
        </IconButton>
        {isEditing ? (
          <PaymentPointerInput ref={inputRef} />
        ) : (
          <span className="px-1 font-medium text-green-7">
            {paymentPointer.url}
          </span>
        )}
      </div>
      <Button
        href={`pp/${paymentPointer.id}`}
        size="sm"
        aria-label="view payent pointer"
        className=""
      >
        View
      </Button>
    </div>
  )
}
