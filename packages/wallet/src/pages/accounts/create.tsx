import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { z } from 'zod'

const newAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long.' }),
  asset: z.string().uuid({ message: 'Selected asset is not valid.' })
})

export default function CreateAccount() {
  const form = useZodForm({
    schema: newAccountSchema
  })

  const onSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AppLayout>
      <PageHeader title="Create a new account" />
      <Form form={form} onSubmit={onSubmit} className="mt-10 max-w-lg">
        <Input
          required
          placeholder="My Account"
          label="Account name"
          error={form.formState?.errors?.name?.message}
          {...form.register('name')}
        />
      </Form>
    </AppLayout>
  )
}
