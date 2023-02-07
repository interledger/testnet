import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { Select, SelectOption } from '@/ui/Select'
import { z } from 'zod'

const newAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long.' }),
  asset: z.string().uuid()
})

export default function CreateAccount() {
  const form = useZodForm({
    schema: newAccountSchema,
    defaultValues: {
      asset: ''
    }
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
        <Select
          value={form.watch('asset')}
          onChange={(e) => {
            form.setValue('asset', e)
          }}
        >
          <SelectOption value="0000000">USD</SelectOption>
          <SelectOption value="1111111">EUR</SelectOption>
          <SelectOption value="2222222">RON</SelectOption>
        </Select>
        <Button type="submit" aria-label="create account">
          Create account
        </Button>
      </Form>
    </AppLayout>
  )
}
