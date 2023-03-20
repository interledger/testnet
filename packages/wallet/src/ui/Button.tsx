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

const buttonStyles = cva(
  ['inline-flex items-center justify-center hover:shadow-md outline-none'],
  {
    variants: {
      intent: {
        primary: [
          'text-white bg-gradient-to-r from-green-5 to-green-6 hover:bg-gradient-primary-dark'
        ],
        secondary: [
          'text-white bg-gradient-secondary hover:bg-gradient-secondary-dark'
        ],
        success: ['text-green-3 bg-white hover:bg-white-1'],
        error: ['text-pink bg-white hover:bg-white-1'],
        outline: [
          'bg-transparent text-orange border border-orange hover:text-white hover:bg-orange'
        ]
      },
      size: {
        sm: 'px-2 py-1 rounded-md font-medium',
        md: 'px-3 py-2 rounded-md font-medium'
      },
      fullWidth: {
        true: 'w-full'
      }
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md'
    }
  }
)

export type ButtonProps = VariantProps<typeof buttonStyles> &
  ButtonOrLinkProps & {
    ['aria-label']: string
    loading?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { fullWidth, intent, size, children, className, loading, ...props },
    ref
  ) => {
    return (
      <ButtonOrLink
        ref={ref}
        className={cx(className, buttonStyles({ intent, size, fullWidth }))}
        {...props}
      >
        {loading && (
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 16 16"
            className="absolute h-5 w-5 animate-spin"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              d="M2.204 6.447A6 6 0 108 2"
            ></path>
          </svg>
        )}
        <div className={cx(loading ? 'invisible' : 'visible')}>{children}</div>
      </ButtonOrLink>
    )
  }
)

Button.displayName = 'Button'
