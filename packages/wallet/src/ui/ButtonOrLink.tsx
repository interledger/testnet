import { forwardRef } from 'react'
import type { ComponentProps } from 'react'
import Link from 'next/link'

export type ButtonOrLinkProps = Omit<
  ComponentProps<'button'> & ComponentProps<'a'>,
  'ref'
>

export const ButtonOrLink = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonOrLinkProps
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
>(({ href, ...props }, ref: any) => {
  const isLink = typeof href !== 'undefined'

  if (isLink) {
    return <Link href={href} ref={ref} {...props} />
  }

  return <button {...props} type={props.type ?? 'button'} ref={ref} />
})

ButtonOrLink.displayName = 'ButtonOrLink'
