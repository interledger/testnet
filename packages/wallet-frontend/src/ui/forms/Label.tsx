import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type LabelProps = Omit<
  ComponentPropsWithoutRef<'label'>,
  'className' | 'children'
> & {
  children: ReactNode
}

export const Label = ({ htmlFor, children, ...props }: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className="text-md block font-medium leading-6 text-green-3"
      {...props}
    >
      {children}
    </label>
  )
}
