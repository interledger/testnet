import { forwardRef } from 'react'

import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

type LinkProps = ButtonOrLinkProps

export const Link = forwardRef<HTMLAnchorElement, LinkProps>((props, ref) => {
  return (
    <ButtonOrLink
      className="text-green-dark underline rounded-md transition-[box-shadow,border-color] ease-in-out duration-200 dark:text-pink-light dark:hover:shadow-glow-link p-1 border border-transparent hover:dark:border-white"
      {...props}
      ref={ref}
    />
  )
})

Link.displayName = 'Link'
