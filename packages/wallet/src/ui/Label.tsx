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
      className="absolute top-0 left-3 block py-1 text-xs font-light text-brand-turqoise transition-all peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-brand-turqoise peer-focus:top-0 peer-focus:text-xs peer-focus:text-brand-green-3"
      {...props}
    >
      {children}
    </label>
  )
}
