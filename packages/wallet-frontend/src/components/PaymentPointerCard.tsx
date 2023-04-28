import { useDialog } from '@/lib/hooks/useDialog'
import { useOnClickOutside } from '@/lib/hooks/useOnClickOutside'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { IconButton } from '@/ui/IconButton'
import { cx } from 'class-variance-authority'
import {
  forwardRef,
  useRef,
  useState,
  type ComponentPropsWithoutRef
} from 'react'
import { z } from 'zod'
import { ConfirmationDialog } from './dialogs/ConfirmationDialog'
import { X } from './icons/X'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { ButtonOrLink, ButtonOrLinkProps } from '@/ui/ButtonOrLink'
import { OPEN_PAYMENTS_HOST } from '@/utils/constants'
import { SuccessDialog } from './dialogs/SuccessDialog'
import { ErrorDialog } from './dialogs/ErrorDialog'
import { useRouter } from 'next/router'

type PaymentPointerCardProps = {
  paymentPointer: PaymentPointer
}

const PaymentPointerInput = forwardRef<
  HTMLInputElement,
  ComponentPropsWithoutRef<'input'>
>((props, ref) => {
  return (
    <div className="flex w-full items-center rounded-md px-1">
      <span>{OPEN_PAYMENTS_HOST}</span>
      <input
        className="underline outline-none"
        defaultValue={'test'}
        ref={ref}
        {...props}
      />
    </div>
  )
})
PaymentPointerInput.displayName = 'PaymentPointerInput'

type PaymentPointerCardButtonProps = ButtonOrLinkProps & {
  ['aria-label']: string
}

const PaymentPointerCardButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PaymentPointerCardButtonProps
>(({ className, children, ...props }, ref) => {
  return (
    <ButtonOrLink
      ref={ref}
      className={cx(
        className,
        'inline-flex items-center justify-center rounded-md px-2 font-medium text-white hover:shadow-md'
      )}
      {...props}
    >
      {children}
    </ButtonOrLink>
  )
})
PaymentPointerCardButton.displayName = 'PaymentPointerCardButton'

const paymentPointerSchema = z.object({
  paymentPointer: z.string().min(3)
})

export const PaymentPointerCard = ({
  paymentPointer
}: PaymentPointerCardProps) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()
  const [isEditing, setIsEditing] = useState(false)
  const form = useZodForm({
    schema: paymentPointerSchema,
    defaultValues: {
      paymentPointer: paymentPointer.url.split('/')[3]
    }
  })

  const cardRef = useRef<HTMLDivElement>(null)

  const handleDeleteConfirmation = async (id: string) => {
    const response = await paymentPointerService.delete(id)
    if (response.success) {
      openDialog(
        <SuccessDialog onClose={closeDialog} content={response.message} />
      )
      if (cardRef && cardRef.current) {
        cardRef.current.remove()
        return
      }
      // This part should never practically reach. The card reference should always
      // exist, but we want to have a fallback in the event that it does:
      router.reload()
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
  }

  useOnClickOutside(cardRef, () => setIsEditing(false))

  return (
    <div ref={cardRef} className={cardStyles}>
      <IconButton
        aria-label="delete payment pointer"
        className="test h-7 w-7 text-red-400 transition-transform duration-150 hover:scale-[115%]"
        onClick={() =>
          openDialog(
            <ConfirmationDialog
              confirmText="Delete payment pointer"
              onConfirm={() => handleDeleteConfirmation(paymentPointer.id)}
              onClose={closeDialog}
            />
          )
        }
      >
        <X stroke="currentColor" strokeWidth={3} />
      </IconButton>
      <div className="flex flex-1 items-center justify-between space-x-2">
        {isEditing ? (
          <Form
            className="w-full"
            form={form}
            onSubmit={(data) => {
              console.log(data)
              setIsEditing(false)
            }}
            stack="h"
          >
            <PaymentPointerInput
              required
              autoFocus
              {...form.register('paymentPointer')}
            />
            <PaymentPointerCardButton
              type="submit"
              aria-label="update payment pointer"
            >
              Save
            </PaymentPointerCardButton>
          </Form>
        ) : (
          <>
            <span className="px-1 font-medium">{paymentPointer.url}</span>
            <PaymentPointerCardButton
              href={`/account/${paymentPointer.accountId}/${paymentPointer.id}`}
              aria-label="view payment pointer"
            >
              View
            </PaymentPointerCardButton>
          </>
        )}
      </div>
    </div>
  )
}

const cardStyles = `
flex items-center justify-between border-b border-b-green-4 px-2 py-3
[&:nth-child(4n+1)_div_a]:bg-green-5 [&:nth-child(4n+1)_div_a:hover]:bg-green-6 
[&:nth-child(4n+2)_div_a]:bg-violet-1 [&:nth-child(4n+2)_div_a:hover]:bg-violet-2
[&:nth-child(4n+3)_div_a]:bg-pink-1 [&:nth-child(4n+3)_div_a:hover]:bg-pink-2
[&:nth-child(4n+4)_div_a]:bg-orange-1 [&:nth-child(4n+4)_div_a:hover]:bg-orange-2
[&:nth-child(4n+1)_div_button]:bg-green-5 [&:nth-child(4n+1)_div_button:hover]:bg-green-6 
[&:nth-child(4n+2)_div_button]:bg-violet-1 [&:nth-child(4n+2)_div_button:hover]:bg-violet-2
[&:nth-child(4n+3)_div_button]:bg-pink-1 [&:nth-child(4n+3)_div_button:hover]:bg-pink-2
[&:nth-child(4n+4)_div_button]:bg-orange-1 [&:nth-child(4n+4)_div_button:hover]:bg-orange-2
[&:nth-child(4n+1)_div]:text-green-6
[&:nth-child(4n+2)_div]:text-violet-2
[&:nth-child(4n+3)_div]:text-pink-2
[&:nth-child(4n+4)_div]:text-orange-2
`
