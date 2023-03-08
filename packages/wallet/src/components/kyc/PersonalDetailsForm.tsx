import { personalDetailsSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select, SelectOption } from '@/ui/forms/Select'
import { fetchCountries, fetchDocuments, getObjectKeys } from '@/utils/helpers'
import { useEffect, useState } from 'react'
import { ErrorDialog } from '../dialogs/ErrorDialog'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { useKYCFormContext } from './context'

export const PersonalDetailsForm = () => {
  const [openDialog, closeDialog] = useDialog()
  const [countries, setCountries] = useState<SelectOption[]>([])
  const { setTab, setDisabled, setIdTypes } = useKYCFormContext()

  // DEV TESTING => always USA selected
  const defaultCountry = { value: 'US', name: 'United States of America' }

  const personalDetailsForm = useZodForm({
    schema: personalDetailsSchema
  })

  const getDocuments = async () => {
    setIdTypes(await fetchDocuments())
  }

  const getCountries = async () => {
    setCountries(await fetchCountries())
  }

  useEffect(() => {
    getCountries()
  }, [])

  return (
    <Form
      form={personalDetailsForm}
      onSubmit={async (data) => {
        const response = await userService.createWallet(data)

        if (!response) {
          openDialog(
            <ErrorDialog
              onClose={closeDialog}
              content="Something went wrong. Please try again"
            />
          )
          return
        }

        if (response.success) {
          openDialog(
            <SuccessDialog
              onClose={closeDialog}
              onSuccess={() => {
                getDocuments()
                setDisabled(false)
                setTab(1)
                closeDialog()
              }}
              content="Your wallet was created."
              redirect="/kyc"
              redirectText="Verify Your Identity"
            />
          )
        } else {
          const { errors, message } = response
          if (errors) {
            getObjectKeys(errors).map((field) =>
              personalDetailsForm.setError(field, { message: errors[field] })
            )
          }
          if (message) {
            personalDetailsForm.setError('root', { message })
          }
        }
      }}
    >
      <span className="font-semibold text-pink">
        Test data is used in development mode!
      </span>
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
        error={personalDetailsForm.formState.errors.country?.message}
        options={countries}
        label="Country"
        // DEV TESTING => always disabled and USA selected
        defaultValue={defaultCountry}
        isDisabled={true}
      />
      <Input
        required
        {...personalDetailsForm.register('city')}
        error={personalDetailsForm.formState.errors.city?.message}
        label="City"
      />
      <Input
        required
        {...personalDetailsForm.register('address')}
        error={personalDetailsForm.formState.errors.address?.message}
        label="Address"
      />
      <Input
        required
        {...personalDetailsForm.register('zip')}
        error={personalDetailsForm.formState.errors.zip?.message}
        label="ZIP Code"
      />
      <Button aria-label="Get Wallet Account" type="submit">
        Get Wallet Account
      </Button>
    </Form>
  )
}
