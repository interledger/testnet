import { cx } from 'class-variance-authority'
import { forwardRef, useRef } from 'react'
import { ButtonOrLink, ButtonOrLinkProps } from '@/ui/ButtonOrLink'
import { Grant } from '@/lib/api/grants'
import { cardStyles } from './PaymentPointerCard'

type GrantCardProps = {
  grant: Grant
}

type GrantCardButtonProps = ButtonOrLinkProps & {
  ['aria-label']: string
}

const GrantCardButton = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  GrantCardButtonProps
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
GrantCardButton.displayName = 'GrantCardButton'

export const GrantCard = ({ grant }: GrantCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null)
  return (
    <div ref={cardRef} className={cardStyles}>
      <div className="flex flex-1 items-center justify-between space-x-2">
        <>
          <span className="px-1 font-medium">{grant.client}</span>
          <GrantCardButton
            href={`/grants/${grant.id}`}
            aria-label="view grant details"
          >
            View
          </GrantCardButton>
        </>
      </div>
    </div>
  )
}
