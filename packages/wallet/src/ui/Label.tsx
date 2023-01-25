import type { ComponentProps, ReactNode } from 'react'

type LabelProps = Omit<
  ComponentProps<'label'>,
  'ref' | 'className' | 'children'
> & {
  children: ReactNode
}

export const Label = ({ htmlFor, children, ...props }: LabelProps) => {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-0.5 font-medium leading-none text-gray-500"
      {...props}
    >
      {children}
    </label>
  )
}
