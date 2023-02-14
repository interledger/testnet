import { cva, cx, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

/**
 * CVA helps us define variants for our components.
 *
 * For this button component, we created two variants: `intent` and `size`.
 *
 * The `VariantProps` helper is going to extract the variants types so we can
 * safely type our button.
 *
 * Usage:
 *  - <Button intent='primary' size='md'>My Button</Button>
 *
 * We can define `defaultVariants` for the component. In our case, if there is
 * no `intent` or `size` passed in, they will use the default variants specified
 * in `defaultVariants` object (in our case `intent -> primary` and `size => md`).
 *
 * Example:
 *  - <Button>My Button</Button>
 */

const buttonStyles = cva(['inline-flex items-center justify-center'], {
  variants: {
    intent: {
      primary: ['text-white bg-gradient-to-r from-[#92DBCA] to-[#56B1AF]'],
      outline: [
        'bg-transparent text-orange-500 border border-orange-500 hover:text-white hover:bg-orange-500'
      ]
    },
    size: {
      sm: 'px-2 py-1 rounded-md font-medium',
      md: 'px-3 py-2 rounded-md font-medium'
    }
  },
  defaultVariants: {
    intent: 'primary',
    size: 'md'
  }
})

type ButtonProps = VariantProps<typeof buttonStyles> &
  ButtonOrLinkProps & {
    ['aria-label']: string
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ intent, size, children, className, ...props }, ref) => {
    return (
      <ButtonOrLink
        ref={ref}
        className={cx(className, buttonStyles({ intent, size }))}
        {...props}
      >
        {children}
      </ButtonOrLink>
    )
  }
)

Button.displayName = 'Button'
