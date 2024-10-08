import { type ComponentProps } from 'react'
import {
  FormProvider,
  type FieldValues,
  type UseFormReturn,
  type SubmitHandler
} from 'react-hook-form'
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
 *            <Form form={form} onSubmit={(data) => console.log(data)}>
 *              <Input required {...form.register('name')} />
 *              <button type="submit">Submit</button>
 *            </Form>
 *       )
 *  }
 * ```
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface FormProps<T extends FieldValues = any>
  extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<T>
  onSubmit: SubmitHandler<T>
  readOnly?: boolean
  // Horizontal or vertical stack (`flex-col` or `flex-row`)
  stack?: 'h' | 'v'
}

type FormErrorProps = {
  error?: string
}

export const FormError = ({ error }: FormErrorProps) => {
  if (!error) return null

  return (
    <div className="text-left p-4 rounded-md border [font-size:smaller] border-pink-dark text-pink-dark dark:border-pink-light dark:text-pink-light flex items-center gap-2">
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
