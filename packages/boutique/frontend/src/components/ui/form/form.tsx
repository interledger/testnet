import { XCircle } from '@/components/icons.tsx'
import { FormHTMLAttributes } from 'react'
import {
  FieldError,
  FieldValues,
  FormProvider,
  UseFormHandleSubmit,
  UseFormReturn,
  get,
  useFormContext
} from 'react-hook-form'

export interface FormProps<TFields extends FieldValues>
  extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  form: UseFormReturn<TFields>
  disabled?: boolean
  onSubmit: ReturnType<UseFormHandleSubmit<TFields>>
}

export const Form = <TFields extends FieldValues>({
  form,
  disabled,
  onSubmit,
  children,
  ...props
}: FormProps<TFields>) => {
  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          return onSubmit(e)
        }}
        {...props}
      >
        <FormError />
        <fieldset disabled={disabled} className="min-w-0 space-y-4">
          {children}
        </fieldset>
      </form>
    </FormProvider>
  )
}

const FormError = () => {
  const form = useFormContext()
  const error = get(form.formState.errors, 'root') as FieldError | undefined
  const message = error?.message

  if (typeof message !== 'string') {
    return null
  }

  return (
    <div className="mb-4 flex space-x-4 rounded-lg bg-red-100 px-4 py-3 shadow-md">
      <div className="flex-shrink-0">
        <XCircle className="h-6 w-6 text-red-400" />
      </div>
      <p className="font-medium text-red-400">{message}</p>
    </div>
  )
}
