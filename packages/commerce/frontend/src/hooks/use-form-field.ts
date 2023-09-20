import { type ReactNode, useId } from 'react'
import { useFormContext } from 'react-hook-form'

export interface UseFormFieldProps {
  name: string
  label?: string
  children?: ReactNode
  className?: string
}

export function useFormField<TProps extends UseFormFieldProps>(props: TProps) {
  const { name, label, className, ...rest } = props
  const { formState, getFieldState } = useFormContext()
  const state = getFieldState(props.name, formState)
  const id = useId()

  return {
    formFieldProps: {
      id,
      name,
      label
    },
    childProps: {
      ...rest,
      id,
      name,
      className,
      'aria-describedby': `${id}-error`,
      'aria-invalid': !!state.error
    }
  }
}
