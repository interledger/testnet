import { ButtonHTMLAttributes, forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center outline-none border-2 underline decoration-transparent underline-offset-2 transition-[box-shadow,background-color,text-decoration-color,color] duration-200 ease-in-out hover:decoration-[currentcolor] focus:decoration-[currentcolor] dark:hover:shadow-glow-button dark:focus:shadow-glow-button disabled:decoration-none disabled:bg-grey-light disabled:text-grey-dark disabled:cursor-not-allowed disabled:hover:shadow-none dark:disabled:decoration-none dark:disabled:bg-grey-light dark:disabled:text-grey-dark dark:disabled:cursor-not-allowed dark:disabled:hover:shadow-none'
  ],
  {
    variants: {
      variant: {
        default: [
          'border-transparent border-none bg-green-dark dark:bg-pink-neon text-white'
        ],
        secondary: [
          'bg-green-light border-none text-green-dark dark:bg-pink-light dark:text-purple'
        ],
        error: [
          'bg-orange-dark border-none bg-opacity-20 text-orange-dark dark:bg-pink-light dark:text-pink-neon'
        ],
        success: [
          'bg-transparent border-green-dark text-green-dark dark:border-pink-neon dark:text-pink-light'
        ],
        ghost: 'border-none'
      },
      size: {
        md: 'p-3 rounded-md'
      },
      fullWidth: {
        true: 'w-full'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  'asChild'?: boolean
  'aria-label': string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
