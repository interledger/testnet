import { cx } from 'class-variance-authority'
import { forwardRef, useRef } from 'react'
import { ButtonOrLink, ButtonOrLinkProps } from '@/ui/ButtonOrLink'
import { Grant } from '@/lib/api/grants'

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
