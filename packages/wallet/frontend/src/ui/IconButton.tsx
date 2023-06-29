import { cx } from 'class-variance-authority'
import { ButtonOrLink, type ButtonOrLinkProps } from './ButtonOrLink'

type IconButtonProps = ButtonOrLinkProps & {
  ['aria-label']: string
}

export const IconButton = ({
  children,
  className,
  ...props
}: IconButtonProps) => {
  return (
    <ButtonOrLink
      className={cx(
        className,
        'inline-flex cursor-pointer items-center bg-transparent disabled:cursor-default'
      )}
      {...props}
    >
      {children}
    </ButtonOrLink>
  )
}
