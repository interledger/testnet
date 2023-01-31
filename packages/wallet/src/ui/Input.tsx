import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { Label } from './Label'
import { FieldError } from './FieldError'

type InputProps = Omit<ComponentPropsWithoutRef<'input'>, 'className'> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, type, error, ...props }, ref) => {
    const id = useId()

    return (
      <div>
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="mt-1 shadow-sm">
          <input
            id={id}
            ref={ref}
            type={type ?? 'text'}
            className="block w-full rounded-md border border-gray-300 transition-colors duration-150 placeholder:font-extralight focus:border-gray-500 focus:outline-none focus:ring-0"
            {...props}
          />
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

Input.displayName = 'Input'
