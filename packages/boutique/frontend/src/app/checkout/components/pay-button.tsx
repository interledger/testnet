import { OpenPaymentsMark } from '@/components/icons.tsx'
import { Button, ButtonProps } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'

export interface PayButtonProps
  extends Omit<ButtonProps, 'variant' | 'size' | 'aria-label'> {}

export const PayButton = ({ className, ...props }: PayButtonProps) => {
  return (
    <Button type="submit" className={cn(className)} aria-label="pay" {...props}>
      <OpenPaymentsMark className="h-8 w-8 mr-2" />
      <span className="text-xl">Pay</span>
    </Button>
  )
}
