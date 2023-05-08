import { type ReactNode, forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { Label } from './Label'
import { FieldError } from './FieldError'
import { cx } from 'class-variance-authority'
import { Spinner } from '@/components/icons/Spinner'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label?: string
  error?: string
  addOn?: ReactNode
  trailing?: ReactNode
  labelHint?: ReactNode
  isLoading?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      addOn,
      error,
      className,
      label,
      labelHint,
      isLoading = false,
      trailing,
      type,
      ...props
    },
    ref
  ) => {
    const id = useId()
    return (
      <div>
        <div className="mt-1">
          {label && (
            <Label htmlFor={id} hint={labelHint}>
              {label}{' '}
              {props.required ? <span className="text-red-500">*</span> : null}
            </Label>
          )}
          <div className="mt-1 flex rounded-md shadow-sm">
            {addOn ? (
              <span className="inline-flex items-center whitespace-pre rounded-l-md border border-r-0 border-turqoise bg-gray-50 px-3 text-gray-600 sm:text-sm">
                {addOn}
              </span>
            ) : null}
            <div className="relative w-full">
              <input
                id={id}
                ref={ref}
                type={type ?? 'text'}
                className={cx(
                  'block w-full min-w-0 flex-1 rounded-md border border-turqoise py-1.5 placeholder:text-black/50 focus:border-green-3 focus:outline-none focus:ring-0 disabled:bg-gray-50 disabled:text-gray-600',
                  addOn && 'rounded-l-none',
                  trailing && 'rounded-r-none',
                  className
                )}
                {...props}
              />
              {isLoading ? (
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                  <Spinner aria-hidden="true" />
                </span>
              ) : null}
            </div>
            {trailing ? (
              <span className="inline-flex items-center whitespace-pre rounded-r-md border border-l-0 border-turqoise bg-gray-50 px-3 text-gray-600 sm:text-sm">
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
