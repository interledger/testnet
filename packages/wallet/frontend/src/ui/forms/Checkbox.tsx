import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { FieldError } from './FieldError'

type CheckboxProps = ComponentPropsWithoutRef<'input'> & {
  label: string
  error?: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ error, label, ...props }, ref) => {
    const id = useId()
    return (
      <div>
        <div className="mt-1 flex justify-evenly">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            className="mt-1 cursor-pointer rounded-md border border-turqoise text-green-3 focus:ring-green-5 disabled:bg-gray-50"
            {...props}
          />
          <label
            htmlFor={id}
            className="text-md cursor-pointer pl-1 font-medium leading-6 text-green-3"
          >
            {label}
          </label>
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
