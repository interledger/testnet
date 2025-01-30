import { forwardRef } from 'react'
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import Link from 'next/link'

export type ButtonOrLinkProps = ComponentPropsWithoutRef<'button'> &
  ComponentPropsWithoutRef<'a'>

export const ButtonOrLink = forwardRef<
  HTMLButtonElement | HTMLAnchorElement,
  ButtonOrLinkProps
>(({ href, ...props }, ref) => {
  const isLink = typeof href !== 'undefined'
  if (isLink && isHTMLAnchorElement(ref, isLink)) {
    return <Link href={href} ref={ref} {...props} />
  }

  if (isHTMLButtonElement(ref, isLink)) {
    return <button {...props} type={props.type ?? 'button'} ref={ref} />
  }

  if (!ref && isLink) {
    return <Link href={href} {...props} />
  }

  return <button {...props} type={props.type ?? 'button'} />
})

ButtonOrLink.displayName = 'ButtonOrLink'

function isHTMLAnchorElement(
  ref: unknown,
  isLink: boolean
): ref is ForwardedRef<HTMLAnchorElement> {
  return !!ref && isLink
}

function isHTMLButtonElement(
  ref: unknown,
  isLink: boolean
): ref is ForwardedRef<HTMLButtonElement> {
  return !!ref && !isLink
}
