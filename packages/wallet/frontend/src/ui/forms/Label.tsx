import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type LabelProps = Omit<
  ComponentPropsWithoutRef<'label'>,
  'className' | 'children'
> & {
  children: ReactNode
  hint?: ReactNode
}

export const Label = ({ hint, htmlFor, children, ...props }: LabelProps) => {
  return (
    <div className="flex justify-between">
      <label
        htmlFor={htmlFor}
        className="text-md block font-medium leading-6"
        {...props}
      >
        {children}
      </label>
      {hint ? hint : null}
    </div>
  )
}
