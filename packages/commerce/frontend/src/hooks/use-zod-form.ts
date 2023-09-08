import { zodResolver } from '@hookform/resolvers/zod'
import { type UseFormProps, useForm } from 'react-hook-form'
import { z } from 'zod'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface UseZodFormProps<TSchema extends z.ZodObject<any>>
  extends Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> {
  schema?: TSchema
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useZodForm<TSchema extends z.ZodObject<any>>(
  props?: UseZodFormProps<TSchema>
) {
  const { schema, ...formProps } = props ?? {}

  return useForm<z.infer<TSchema>>({
    ...formProps,
    resolver: zodResolver(schema ?? z.object({}))
  })
}
