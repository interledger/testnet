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
        <div className="relative mt-1">
          <input
            id={id}
            ref={ref}
            type={type ?? 'text'}
            className="peer block w-full rounded-xl border border-turqoise pt-4 pb-1 placeholder-transparent shadow-md transition-colors duration-150 focus:border-green-3 focus:outline-none focus:ring-0 disabled:bg-black/5"
            {...props}
            placeholder={label}
          />
          {label && <Label htmlFor={id}>{label}</Label>}
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

Input.displayName = 'Input'
