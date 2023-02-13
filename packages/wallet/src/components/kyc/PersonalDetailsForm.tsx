import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { z } from 'zod'

const personalDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  country: z.string(),
  address: z.string()
})

export const PersonalDetailsForm = () => {
  const personalDetailsForm = useZodForm({
    schema: personalDetailsSchema
  })

  const handleSubmit = personalDetailsForm.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <Form form={personalDetailsForm} onSubmit={handleSubmit}>
      <div className="flex flex-row justify-between">
        <Input
          required
          {...personalDetailsForm.register('firstName')}
          error={personalDetailsForm.formState.errors.firstName?.message}
          label="First name"
        />
        <Input
          required
          {...personalDetailsForm.register('lastName')}
          error={personalDetailsForm.formState.errors.lastName?.message}
          label="Last name"
        />
      </div>
      <Input
        required
        {...personalDetailsForm.register('country')}
        error={personalDetailsForm.formState.errors.country?.message}
        label="Country"
      />
      <Input
        required
        {...personalDetailsForm.register('address')}
        error={personalDetailsForm.formState.errors.address?.message}
        label="Address"
      />
    </Form>
  )
}
