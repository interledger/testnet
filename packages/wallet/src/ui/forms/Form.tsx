import { type ComponentProps } from 'react'
import {
  useForm,
  FormProvider,
  type FieldValues,
  type UseFormReturn,
  type UseFormProps,
  type SubmitHandler
} from 'react-hook-form'
import { type ZodSchema, type TypeOf } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

/**
 * General usage:
 *
 * ```
 *  const nameSchema = z.object({
 *      name: z.string().min(1)
 *  });
 *
 *  const UpdateNameForm = () => {
 *      const form = useZodForm({
 *		    schema: nameSchema
 *      });
 *
 *      return (
 *            <Form form={form} onSubmit={(data) => {
 *                <Input required {...form.register('name')} />
 *            }}>
 *       )
 *  }
 * ```
 */

interface UseZodFormProps<T extends ZodSchema> extends UseFormProps<TypeOf<T>> {
  schema: T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FormProps<T extends FieldValues = any>
  extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<T>
  onSubmit: ReturnType<SubmitHandler<T>>
  readOnly?: boolean
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

export const Form = <T extends FieldValues>({
  form,
  onSubmit,
  children,
  readOnly = false,
  ...props
}: FormProps<T>) => {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
        <fieldset
          disabled={form.formState.isSubmitting || readOnly}
          className="flex flex-col space-y-4"
        >
          {children}
        </fieldset>
      </form>
    </FormProvider>
  )
}
