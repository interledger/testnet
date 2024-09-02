import { HeaderLogo } from '@/components/HeaderLogo'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import AuthLayout from '@/components/layouts/AuthLayout'
import { personalDetailsSchema, userService } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select, SelectOption } from '@/ui/forms/Select'
import { USE_TEST_DATA_KYC } from '@/utils/constants'
import { getObjectKeys } from '@/utils/helpers'
import { useRouter } from 'next/router'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'
import { Controller } from 'react-hook-form'

type PersonalDetailsProps = InferGetServerSidePropsType<
  typeof getServerSideProps
>

const PersonalDetailsPage: NextPageWithLayout<PersonalDetailsProps> = ({
  countries
}) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

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

  return (
    <>
      <h2 className="py-2 text-xl font-semibold text-green dark:text-pink-neon">
        Personal Details
      </h2>
      {USE_TEST_DATA_KYC && (
        <span className="mb-10 text-center font-semibold text-pink-dark dark:text-teal-neon">
          Denmark is selected by default for testing purposes!
        </span>
      )}
      <Form
        className="mt-2 px-2"
        form={personalDetailsForm}
        onSubmit={async (data) => {
          const response = await userService.createWallet(data)

          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={closeDialog}
                onSuccess={() => {
                  router.push('/kyc/proof')
                  closeDialog()
                }}
                content="Your wallet was created."
                redirect="/kyc/proof"
                redirectText="Verify your identity"
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
        <div className="flex flex-row justify-between gap-2">
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
              required
              label="Country"
              placeholder="Select country..."
              options={countries}
              value={value}
              isDisabled={USE_TEST_DATA_KYC}
              error={personalDetailsForm.formState.errors.country?.message}
              onChange={(option) => {
                if (option) {
                  personalDetailsForm.setValue('country', { ...option })
                }
              }}
            />
          )}
        />
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
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  countries: SelectOption[]
}> = async (ctx) => {
  const countries = await userService.getCountries(ctx.req.headers.cookie)
  return {
    props: {
      countries
    }
  }
}

PersonalDetailsPage.getLayout = function (page) {
  return (
    <AuthLayout image="People">
      <HeaderLogo header="Complete KYC" />
      {page}
    </AuthLayout>
  )
}

export default PersonalDetailsPage
