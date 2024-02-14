import { forwardRef, useId } from 'react'
import type { ComponentPropsWithoutRef } from 'react'
import { FieldError } from './FieldError'
import { Label } from './Label'

type TextAreaProps = ComponentPropsWithoutRef<'textarea'> & {
  label: string
  error?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ error, label, ...props }, ref) => {
    const id = useId()
    return (
      <div>
        {label && (
          <Label htmlFor={id}>
            {label}{' '}
            {props.required ? <span className="text-red-500">*</span> : null}
          </Label>
        )}
        <div className="mt-1">
          <textarea
            id={id}
            ref={ref}
            rows={4}
            className="w-full cursor-pointer rounded-md border border-turqoise"
            {...props}
          />
        </div>
        <FieldError error={error} />
      </div>
    )
  }
)

TextArea.displayName = 'TextArea'
