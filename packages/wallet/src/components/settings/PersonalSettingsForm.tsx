import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { useState } from 'react'
import { z } from 'zod'

export type PersonalDetailsProps = {
  firstName: string
  lastName: string
  address: string
  email: string
}

type PersonalSettingsFormProps = {
  personalDetails: PersonalDetailsProps
}

const personalSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  address: z.string().min(3),
  email: z.string().email()
})

export const PersonalSettingsForm = ({
  personalDetails
}: PersonalSettingsFormProps) => {
  const [isReadOnly, setIsReadOnly] = useState(true)
  const form = useZodForm({
    schema: personalSchema,
    defaultValues: personalDetails
  })

  const onSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <>
      <div className="mb-5">
        <h3 className="text-2xl text-turqoise">Profile</h3>
      </div>
      <Form form={form} onSubmit={onSubmit} readOnly={isReadOnly}>
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
        {!isReadOnly && (
          <div className="mt-2 flex justify-between">
            <Button
              intent="outline"
              aria-label="stop editing"
              onClick={() => setIsReadOnly(!isReadOnly)}
            >
              Close editing
            </Button>
            <Button type="submit" aria-label="save personal settings">
              Save personal settings
            </Button>
          </div>
        )}
      </Form>
      {isReadOnly && (
        <div className="mt-4">
          <Button
            intent="primary"
            aria-label="edit personal details"
            onClick={() => setIsReadOnly(!isReadOnly)}
          >
            Edit
          </Button>
        </div>
      )}
    </>
  )
}
