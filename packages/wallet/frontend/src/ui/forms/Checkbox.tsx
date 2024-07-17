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
        <div className="mt-1 flex items-center gap-3 [font-size:smaller]">
          <input
            id={id}
            ref={ref}
            type="checkbox"
            className="disabled:bg-gray-50 mt-1 cursor-pointer rounded-md border border-green focus:border-black focus:ring-green-bright dark:border-pink-neon dark:focus:border-white dark:focus:shadow-glow-link"
            {...props}
          />
          <label htmlFor={id} className="text-left">
            {label}
          </label>
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'
