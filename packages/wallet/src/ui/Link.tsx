import { forwardRef } from 'react'

import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

type LinkProps = ButtonOrLinkProps

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return <ButtonOrLink {...props} ref={ref} />
})

Link.displayName = 'Link'
