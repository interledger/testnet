import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { FieldError } from './FieldError'

type CheckboxProps = ComponentPropsWithoutRef<'input'> & {
  label: string | ReactNode
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
            className="cursor-pointer rounded-md border text-green accent-green dark:accent-pink-neon dark:focus:shadow-glow-button disabled:bg-black/5"
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
