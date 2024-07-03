import { Spinner } from '@/components/icons/Spinner'
import { cva, cx, type VariantProps } from 'class-variance-authority'
import { forwardRef } from 'react'

import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

const buttonStyles = cva(
  ['inline-flex items-center justify-center outline-none border-2 border-transparent underline decoration-transparent underline-offset-2 transition-[box-shadow,background-color,text-decoration-color,color] duration-200 ease-in-out hover:decoration-[currentcolor] focus:decoration-[currentcolor] dark:hover:shadow-glow-button dark:focus:shadow-glow-button'],
  {
    variants: {
      intent: {
        primary: [
          'bg-green-dark dark:bg-pink-neon text-white'
        ],
        outline: [
          'bg-transparent border-green-dark text-green-dark dark:border-pink-neon dark:text-pink-light'
        ],
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
        className={cx(className, buttonStyles({ intent, size, fullWidth }), "hover:decoration-")}
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
