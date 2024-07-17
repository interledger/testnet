import { Spinner } from '@/components/icons/Spinner'
import { cva, cx, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

const buttonStyles = cva(
  [
    'inline-flex items-center justify-center outline-none border-2 underline decoration-transparent underline-offset-2 transition-[box-shadow,background-color,text-decoration-color,color] duration-200 ease-in-out hover:decoration-[currentcolor] focus:decoration-[currentcolor] dark:hover:shadow-glow-button dark:focus:shadow-glow-button'
  ],
  {
    variants: {
      intent: {
        primary: [
          'text-white bg-green-dark hover:bg-white border hover:border-green-dark hover:text-green-dark dark:border-none dark:hover:text-white dark:bg-pink-neon dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ],
        outline: [
          'text-green-dark border border-green-dark hover:text-white hover:bg-green-dark dark:bg-purple dark:border-pink-neon dark:text-white dark:hover:border-black dark:hover:shadow-glow-link dark:hover:border-white'
        ]
      },
      size: {
        md: 'p-3 rounded-md'
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
        className={cx(
          className,
          buttonStyles({ intent, size, fullWidth }),
          'hover:decoration-'
        )}
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
