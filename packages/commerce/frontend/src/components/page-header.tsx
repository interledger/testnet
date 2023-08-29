import { cn } from '@/lib/utils.ts'
import { HTMLAttributes } from 'react'

export const PageHeader = ({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <section
      className={cn('flex flex-col items-start text-turqoise', className)}
      {...props}
    >
      {children}
    </section>
  )
}

export const PageHeaderHeading = ({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h1
      className={cn(
        'text-xl font-bold leading-tight tracking-tighter md:text-3xl',
        className
      )}
      {...props}
    />
  )
}

export const PageHeaderDescription = ({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) => {
  return <p className={cn('text-turqoise md:text-lg', className)} {...props} />
}
