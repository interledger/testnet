import { Spinner } from '@/components/icons/Spinner'
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
          'text-white bg-green-dark hover:bg-white border hover:border-green-dark hover:text-green-dark dark:border-none dark:hover:text-white dark:bg-pink-neon dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ],
        secondary: [
          'text-green-dark bg-white border border-green-dark hover:underline dark:bg-purple dark:border-pink-neon dark:text-pink-light dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ],
        success: [
          'text-green-modal border border-green-modal bg-white hover:bg-green-light dark:bg-purple dark:border-green-neon dark:text-green-neon dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ],
        error: [
          'text-orange-dark border border-orange-dark bg-white hover:bg-orange-dark hover:text-white dark:bg-purple dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ],
        outline: [
          'text-green-dark border border-green-dark hover:text-white hover:bg-green-dark dark:bg-purple dark:border-pink-neon dark:text-white dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ]
      },
      size: {
        xs: 'px-1 rounded-md font-small',
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
          <span className="absolute">
            <Spinner />
          </span>
        )}
        <div className={cx(loading ? 'invisible' : 'visible')}>{children}</div>
      </ButtonOrLink>
    )
  }
)

Button.displayName = 'Button'
