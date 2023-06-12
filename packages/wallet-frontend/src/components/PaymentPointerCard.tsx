import { useDialog } from '@/lib/hooks/useDialog'
import { IconButton } from '@/ui/IconButton'
import { cx } from 'class-variance-authority'
import { forwardRef, useRef } from 'react'
import { ConfirmationDialog } from './dialogs/ConfirmationDialog'
import { X } from './icons/X'
import { PaymentPointer, paymentPointerService } from '@/lib/api/paymentPointer'
import { ButtonOrLink, ButtonOrLinkProps } from '@/ui/ButtonOrLink'
import { SuccessDialog } from './dialogs/SuccessDialog'
import { ErrorDialog } from './dialogs/ErrorDialog'
import { useRouter } from 'next/router'
import { useOnboardingContext } from '@/lib/context/onboarding'

type PaymentPointerCardProps = {
  paymentPointer: PaymentPointer
  idOnboarding?: string
}

type PaymentPointerCardButtonProps = ButtonOrLinkProps & {
  ['aria-label']: string
}

const PaymentPointerCardButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  PaymentPointerCardButtonProps
>(({ className, children, ...props }, ref) => {
  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()
  return (
    <ButtonOrLink
      ref={ref}
      className={cx(
        className,
        'inline-flex items-center justify-center rounded-md px-2 font-medium text-white hover:shadow-md'
      )}
      onClick={() => {
        if (isUserFirstTime) {
          setRunOnboarding(false)
        }
      }}
      {...props}
    >
      {children}
    </ButtonOrLink>
  )
})
PaymentPointerCardButton.displayName = 'PaymentPointerCardButton'

export const PaymentPointerCard = ({
  paymentPointer,
  idOnboarding
}: PaymentPointerCardProps) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()

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
        <>
          <span className="px-1 font-medium">{paymentPointer.url}</span>
          <PaymentPointerCardButton
            href={`/account/${paymentPointer.accountId}/${paymentPointer.id}`}
            aria-label="view payment pointer"
            id={idOnboarding}
          >
            View
          </PaymentPointerCardButton>
        </>
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
