import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import * as LabelPrimitive from '@radix-ui/react-label'
import { cn } from '@/lib/utils'

export interface LabelRefType extends ElementRef<typeof LabelPrimitive.Root> {}

export interface LabelProps
  extends ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {}

export const Label = forwardRef<LabelRefType, LabelProps>(
  ({ className, ...props }, ref) => (
    <LabelPrimitive.Root
      ref={ref}
      className={cn('mb-1 flex text-sm font-semibold leading-none', className)}
      {...props}
    />
  )
)
Label.displayName = LabelPrimitive.Root.displayName
