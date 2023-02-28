import { useDialog } from '@/lib/hooks/useDialog'
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/forms/Form'
import { IconButton } from '@/ui/IconButton'
import {
  ComponentPropsWithoutRef,
  createRef,
  forwardRef,
  useEffect,
  useState
} from 'react'
import { ConfirmationDialog } from './dialogs/ConfirmationDialog'
import { PencilSquare } from './icons/Pencil'
import { X } from './icons/X'
import { z } from 'zod'

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
    <div className="flex w-full items-center rounded-md">
      <span className="border-green px-1 text-green">$rafiki.money/</span>
      <input
        className="border-b-violet underline outline-none"
        defaultValue={'test'}
        ref={ref}
        {...props}
      />
    </div>
  )
})
PaymentPointerInput.displayName = 'PaymentPointerInput'

const paymentPointerSchema = z.object({
  paymentPointer: z.string().min(3)
})

export const PaymentPointerCard = ({
  paymentPointer
}: PaymentPointerCardProps) => {
  const [openDialog, closeDialog] = useDialog()
  const [isEditing, setIsEditing] = useState(false)
  const form = useZodForm({
    schema: paymentPointerSchema
  })
  const inputRef = createRef<HTMLInputElement>()
  const cardRef = createRef<HTMLDivElement>()

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  const handleDeleteConfirmation = () => {
    console.log('deletion confirmed')
  }

  useOnClickOutside(cardRef, () => setIsEditing(false))
  useEffect(() => {
    inputRef.current?.focus()
  }, [inputRef])

  return (
    <div
      ref={cardRef}
      className="flex items-center justify-between rounded-md px-2 py-3 shadow-md shadow-green-4 hover:shadow-green-6"
    >
      <div className="flex flex-1 items-center space-x-2">
        {isEditing ? (
          <IconButton
            aria-label="delete payment pointer"
            className="h-7 w-7 text-pink transition-transform duration-150 hover:scale-[115%]"
            onClick={() =>
              openDialog(
                <ConfirmationDialog
                  confirmText="Delete payment pointer"
                  onConfirm={handleDeleteConfirmation}
                  onClose={closeDialog}
                />
              )
            }
          >
            <X stroke="currentColor" strokeWidth={3} />
          </IconButton>
        ) : (
          <IconButton
            onClick={() => {
              setIsEditing(!isEditing)
            }}
            aria-label="edit payment pointer"
            className="h-7 w-7 text-green-7 transition-transform duration-150 hover:scale-[115%] hover:text-green-3"
          >
            <PencilSquare />
          </IconButton>
        )}

        {isEditing ? (
          <Form
            className="w-full"
            form={form}
            onSubmit={handleSubmit}
            stack="h"
          >
            <PaymentPointerInput ref={inputRef} />
            <Button type="submit" size="sm" aria-label="update payment pointer">
              Save
            </Button>
          </Form>
        ) : (
          <span className="px-1 font-medium text-green-7">
            {paymentPointer.url}
          </span>
        )}
      </div>
      {isEditing ? null : (
        <Button
          intent="secondary"
          href={`pp/${paymentPointer.id}`}
          size="sm"
          aria-label="view payment pointer"
        >
          View
        </Button>
      )}
    </div>
  )
}
