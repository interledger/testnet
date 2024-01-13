import { forwardRef } from 'react'
import { type UseFormFieldProps, useFormField } from '@/hooks/use-form-field.ts'
import { Input, InputProps } from '../input.tsx'
import { FormField } from './form-field.tsx'

export interface InputFieldProps extends UseFormFieldProps, InputProps {
  name: string
}

export const InputField = forwardRef<HTMLInputElement, InputFieldProps>(
  (props, ref) => {
    const { formFieldProps, childProps } = useFormField(props)

    return (
      <FormField {...formFieldProps}>
        <Input ref={ref} {...childProps} />
      </FormField>
    )
  }
)
InputField.displayName = 'InputField'
