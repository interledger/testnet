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
      className="absolute -top-1 left-3 block py-1 text-sm font-light text-brand-turqoise transition-all peer-placeholder-shown:top-1.5 peer-placeholder-shown:text-base peer-placeholder-shown:text-brand-turqoise peer-focus:-top-1 peer-focus:text-sm peer-focus:text-brand-green-3"
      {...props}
    >
      {children}
    </label>
  )
}
