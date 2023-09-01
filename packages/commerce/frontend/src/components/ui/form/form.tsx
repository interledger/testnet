
import { FormHTMLAttributes } from 'react'
import {
  FieldValues,
  FormProvider,
  UseFormHandleSubmit,
  UseFormReturn
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
        <fieldset
          disabled={disabled || form.formState.isSubmitting}
          // TODO: Figure out why fieldset has a weird behaviour ???
        >
          {children}
        </fieldset>
      </form>
    </FormProvider>
  )
}
