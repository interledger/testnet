import { zodResolver } from '@hookform/resolvers/zod'
import type { UseFormProps } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import type { TypeOf, ZodSchema } from 'zod'

interface UseZodFormProps<T extends ZodSchema> extends UseFormProps<TypeOf<T>> {
  schema: T
}

export const useZodForm = <T extends ZodSchema>({
  schema,
  ...props
}: UseZodFormProps<T>) => {
  return useForm({
    mode: 'onBlur',
    criteriaMode: 'all',
    resolver: zodResolver(schema),
    ...props
  })
}
