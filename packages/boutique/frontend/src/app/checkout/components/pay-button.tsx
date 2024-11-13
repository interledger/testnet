import { PayWithInterledgerMark } from '@/components/icons.tsx'
import { Button, ButtonProps } from '@/components/ui/button.tsx'
import { cn } from '@/lib/utils.ts'

export interface PayButtonProps
  extends Omit<ButtonProps, 'variant' | 'size' | 'aria-label'> {}

export const PayButton = ({ className, ...props }: PayButtonProps) => {
  return (
    <Button type="submit" className={cn(className)} aria-label="pay" {...props}>
      <span className="text-md">Pay with</span>
      <PayWithInterledgerMark className="h-8 w-40 mr-2" />
    </Button>
  )
}
