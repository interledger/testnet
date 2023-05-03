import { type ReactNode, forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'

import { Label } from './Label'
import { FieldError } from './FieldError'
import { cx } from 'class-variance-authority'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label?: string
  error?: string
  addOn?: ReactNode
  trailing?: ReactNode
  labelHint?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { addOn, error, className, label, labelHint, trailing, type, ...props },
    ref
  ) => {
    const id = useId()
    return (
      <div>
        <div className="relative mt-1">
          {label && (
            <Label htmlFor={id} hint={labelHint}>
              {label}{' '}
              {props.required ? <span className="text-red-500">*</span> : null}
            </Label>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            {addOn ? (
              <span className="inline-flex items-center rounded-l-md border border-r-0 border-turqoise bg-gray-50 px-3 text-black/50 sm:text-sm">
                {addOn}
              </span>
            ) : null}
            <input
              id={id}
              ref={ref}
              type={type ?? 'text'}
              className={cx(
                'block w-full min-w-0 flex-1 rounded-md border border-turqoise py-1.5 placeholder:text-black/50 focus:border-green-3 focus:outline-none focus:ring-0',
                addOn && 'rounded-l-none',
                trailing && 'rounded-r-none',
                className
              )}
              {...props}
            />
            {trailing ? (
              <span className="inline-flex items-center rounded-r-md border border-l-0 border-turqoise bg-gray-50 px-3 text-black/50 sm:text-sm">
                {trailing}
              </span>
            ) : null}
          </div>
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

Input.displayName = 'Input'
