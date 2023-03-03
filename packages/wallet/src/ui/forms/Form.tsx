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
import { cx } from 'class-variance-authority'
import { XCircle } from '@/components/icons/X'

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
  // Horizontal or vertical stack (`flex-col` or `flex-row`)
  stack?: 'h' | 'v'
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

type FormErrorProps = {
  error?: string
}

export const FormError = ({ error }: FormErrorProps) => {
  if (!error) return null

  return (
    <div className="flex space-x-4 rounded-lg bg-red-100 px-4 py-3 shadow-md">
      <div className="flex-shrink-0">
        <XCircle className="h-6 w-6 text-red-400" />
      </div>
      <p className="font-medium text-red-400">{error}</p>
    </div>
  )
}

export const Form = <T extends FieldValues>({
  form,
  onSubmit,
  children,
  readOnly = false,
  stack = 'v',
  ...props
}: FormProps<T>) => {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} {...props}>
        <fieldset
          disabled={form.formState.isSubmitting || readOnly}
          className={cx(
            'flex',
            stack === 'v' ? 'flex-col space-y-4' : 'space-x-4'
          )}
        >
          <FormError error={form.formState.errors.root?.message} />
          {children}
        </fieldset>
      </form>
    </FormProvider>
  )
}
