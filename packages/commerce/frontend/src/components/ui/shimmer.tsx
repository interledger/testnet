import { cn } from '@/lib/utils.ts'
import { HTMLAttributes } from 'react'

export const Shimmer = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-black/10', className)}
      {...props}
    />
  )
}
