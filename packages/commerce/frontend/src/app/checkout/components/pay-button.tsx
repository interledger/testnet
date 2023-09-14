import { OpenPaymentsLogo } from '@/components/icons.tsx'
import { Button, ButtonProps } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'

export interface PayButtonProps
  extends Omit<ButtonProps, 'variant' | 'size' | 'aria-label'> {}

export const PayButton = ({ className, ...props }: PayButtonProps) => {
  return (
    <Button
      type="submit"
      variant="ghost"
      className={cn(
        'flex h-12 min-w-[90px] items-center justify-center gap-x-2 rounded-md bg-black px-2 text-white shadow-lg focus:outline-none',
        className
      )}
      aria-label="pay"
      {...props}
    >
      <OpenPaymentsLogo className="h-6 w-6" />
      <span className="text-xl">Pay</span>
    </Button>
  )
}
