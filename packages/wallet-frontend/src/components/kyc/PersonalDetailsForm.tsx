import { personalDetailsSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select, SelectOption } from '@/ui/forms/Select'
import { USE_TEST_DATA_KYC } from '@/utils/constants'
import { fetchCountries, fetchDocuments, getObjectKeys } from '@/utils/helpers'
import { useEffect, useState } from 'react'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { useKYCFormContext } from './context'
import { Controller } from 'react-hook-form'

export const PersonalDetailsForm = () => {
  const [openDialog, closeDialog] = useDialog()
  const [countries, setCountries] = useState<SelectOption[]>([])
  const { setTab, setDisabled, setIdTypes } = useKYCFormContext()

  const defaultTestValues = {
    city: 'Copenhagen',
    address: 'Den Lille Havfrue',
    zip: '2100',
    country: {
      value: 'DK',
      label: 'Denmark'
    }
  }

  const personalDetailsForm = useZodForm({
    schema: personalDetailsSchema,
    defaultValues: { ...(USE_TEST_DATA_KYC ? defaultTestValues : {}) }
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

  console.log(personalDetailsForm.formState.errors)
  return (
    <Form
      form={personalDetailsForm}
      onSubmit={async (data) => {
        const response = await userService.createWallet(data)

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
          personalDetailsForm.setError('root', { message })

          if (errors) {
            getObjectKeys(errors).map((field) =>
              personalDetailsForm.setError(field, { message: errors[field] })
            )
          }
        }
      }}
    >
      {USE_TEST_DATA_KYC && (
        <span className="font-semibold text-pink">
          Denmark is selected by default for testing purposes!
        </span>
      )}
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
      <Controller
        name="country"
        render={({ field: { value } }) => (
          <Select<SelectOption>
            options={countries}
            value={value}
            onChange={(option) => {
              if (option) {
                personalDetailsForm.setValue(
                  'country',
                  { ...option },
                  {
                    shouldDirty: true
                  }
                )
              }
            }}
          />
        )}
      />
      {personalDetailsForm.formState.errors.country?.message}
      <Input
        required
        {...personalDetailsForm.register('city')}
        error={personalDetailsForm.formState.errors.city?.message}
        label="City"
        readOnly={USE_TEST_DATA_KYC}
      />
      <Input
        required
        {...personalDetailsForm.register('address')}
        error={personalDetailsForm.formState.errors.address?.message}
        label="Address"
        readOnly={USE_TEST_DATA_KYC}
      />
      <Input
        required
        {...personalDetailsForm.register('zip')}
        error={personalDetailsForm.formState.errors.zip?.message}
        label="ZIP Code"
        readOnly={USE_TEST_DATA_KYC}
      />
      <Button
        aria-label="Get Wallet Account"
        type="submit"
        loading={personalDetailsForm.formState.isSubmitting}
      >
        Get Wallet Account
      </Button>
    </Form>
  )
}
