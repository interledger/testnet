import * as ToastPrimitives from '@radix-ui/react-toast'
import { cx } from 'class-variance-authority'
import {
  ComponentPropsWithoutRef,
  ElementRef,
  forwardRef,
  SVGProps
} from 'react'
import { X } from './icons/X'

type NotificationToastProps = {
  title?: string
  content: string
  Icon?: (props: SVGProps<SVGSVGElement>) => JSX.Element
}
export const ToastViewport = forwardRef<
  ElementRef<typeof ToastPrimitives.Viewport>,
  ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cx(
      'fixed bottom-0 right-0 top-auto z-[100] flex max-h-screen w-full flex-col p-4 md:max-w-[420px]',
      className
    )}
    {...props}
  />
))
ToastViewport.displayName = ToastPrimitives.Viewport.displayName

export const ToastProvider = ToastPrimitives.Provider
export const NotificationToast = ({
  title,
  content,
  Icon,
  ...props
}: NotificationToastProps) => {
  return (
    <>
      <ToastPrimitives.Root
        className="pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border border-green-3 bg-white p-6 pr-8 text-green-3 shadow-lg transition-all focus:outline-none focus:ring-green-3 data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-bottom-full"
        {...props}
      >
        {title && <ToastPrimitives.Title>{title}</ToastPrimitives.Title>}
        <ToastPrimitives.Description>
          {Icon && (
            <Icon className="mr-5 inline-flex h-8 w-8 items-center justify-center" />
          )}
          {content}
        </ToastPrimitives.Description>
        <ToastPrimitives.Close aria-label="Close">
          <X className="h-4 w-4" />
        </ToastPrimitives.Close>
      </ToastPrimitives.Root>
      <ToastViewport />
    </>
  )
}
