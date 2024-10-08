import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cx } from 'class-variance-authority'

export const TooltipProvider = TooltipPrimitive.Provider

export const Tooltip = TooltipPrimitive.Root

export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cx(
      'z-50 overflow-hidden rounded-md bg-green-dark text-white dark:bg-purple-bright px-3 py-1.5 text-xs',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName
