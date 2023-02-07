import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SettingsTabs } from '@/components/SettingsTabs'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { z } from 'zod'

const personalSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  address: z.string().min(3),
  email: z.string().email()
})

export default function Personal() {
  const form = useZodForm({
    schema: personalSchema,
    defaultValues: {
      firstName: 'John',
      lastName: 'Doe',
      address: 'Edmond Street 5, 10555, London, United Kingdom',
      email: 'john@doe.com'
    }
  })

  const onSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AppLayout>
      <PageHeader title="Personal Settings" message="Your account details" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <Form form={form} onSubmit={onSubmit}>
          <Input
            required
            label="First name"
            placeholder="First name"
            error={form.formState.errors.firstName?.message}
            {...form.register('firstName')}
          />
          <Input
            required
            label="Last name"
            placeholder="Last name"
            error={form.formState.errors.lastName?.message}
            {...form.register('lastName')}
          />
          <Input
            required
            label="Address"
            placeholder="Address"
            error={form.formState.errors.address?.message}
            {...form.register('address')}
          />
          <Input
            required
            type="email"
            label="Email"
            placeholder="Address"
            error={form.formState.errors.email?.message}
            {...form.register('email')}
          />
          <Button type="submit" aria-label="save personal changes">
            Save
          </Button>
        </Form>
      </div>
    </AppLayout>
  )
}
