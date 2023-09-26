import { HTMLAttributes, ReactNode } from 'react'
import { FieldError, get, useFormContext } from 'react-hook-form'
import { UseFormFieldProps } from '@/hooks/use-form-field.ts'
import { Label } from '../label.tsx'
import { cn } from '@/lib/utils.ts'

interface FormFieldProps extends Omit<UseFormFieldProps, 'label'> {
  id: string
  name: string
  label?: string | ReactNode
}

export const FormField = (props: FormFieldProps) => {
  return (
    <div>
      {props.label ? <Label htmlFor={props.id}>{props.label}</Label> : null}
      {props.children}
      <FormFieldError name={props.name} id={`${props.id}-error`} />
    </div>
  )
}

interface FormFieldErrorProps extends HTMLAttributes<HTMLParagraphElement> {
  name: string
}

export const FormFieldError = ({
  className,
  name,
  ...props
}: FormFieldErrorProps) => {
  const form = useFormContext()
  const error = get(form.formState.errors, name) as FieldError | undefined
  const message = error?.message

  if (typeof message !== 'string') {
    return null
  }

  return (
    <p className={cn('mt-2 text-sm text-red-600', className)} {...props}>
      {message}
    </p>
  )
}
