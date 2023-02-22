import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select } from '@/ui/forms/Select'
import { z } from 'zod'

type CountryProps = {
  name: string
  value: string
}

type PersonalDetailsProps = {
  countries: Array<CountryProps>
}

const personalDetailsSchema = z.object({
  firstName: z.string().min(3),
  lastName: z.string().min(3),
  country: z.string(),
  address: z.string().min(3),
  dateOfBirth: z.coerce.date(),
  phone: z.coerce.number()
})

export const PersonalDetailsForm = ({ countries }: PersonalDetailsProps) => {
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
      <Select
        name="country"
        setValue={personalDetailsForm.setValue}
        defaultValue={countries[0]}
        error={personalDetailsForm.formState.errors.country?.message}
        options={countries}
        label="Country"
      />
      <Input
        required
        {...personalDetailsForm.register('address')}
        error={personalDetailsForm.formState.errors.address?.message}
        label="Address"
      />
      <Input
        required
        {...personalDetailsForm.register('phone')}
        error={personalDetailsForm.formState.errors.phone?.message}
        label="Phone"
      />
      <Input
        required
        {...personalDetailsForm.register('dateOfBirth')}
        type="date"
        error={personalDetailsForm.formState.errors.dateOfBirth?.message}
        label="Date of birth"
      />
      <Button aria-label="Get Wallet Account" type="submit">
        Get Wallet Account
      </Button>
    </Form>
  )
}
