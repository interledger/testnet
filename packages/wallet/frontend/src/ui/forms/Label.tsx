import { cx } from 'class-variance-authority'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'

type LabelProps = Omit<
  ComponentPropsWithoutRef<'label'>,
  'className' | 'children'
> & {
  children: ReactNode
  hint?: ReactNode
  inputType?: string
}

export const Label = ({
  hint,
  htmlFor,
  inputType,
  children,
  ...props
}: LabelProps) => {
  return (
    <div className="flex justify-between">
      <label
        htmlFor={htmlFor}
        className={cx(
          'text-md block font-medium leading-6 text-green-3',
          inputType === 'checkbox' && 'cursor-pointer'
        )}
        {...props}
      >
        {children}
      </label>
      {hint ? hint : null}
    </div>
  )
}
