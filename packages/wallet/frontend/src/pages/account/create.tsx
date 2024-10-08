import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { accountService } from '@/lib/api/account'
import { getObjectKeys } from '@/utils/helpers'
import { assetService } from '@/lib/api/asset'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useEffect } from 'react'
import { createAccountSchema } from '@wallet/shared'
import { BASE_ASSET_SCALE } from '@/utils/constants'

type CreateAccountProps = InferGetServerSidePropsType<typeof getServerSideProps>
const CreateAccountPage: NextPageWithLayout<CreateAccountProps> = ({
  assets
}) => {
  const [openDialog, closeDialog] = useDialog()
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const defaultValue = {
    asset: assets.find((asset) => asset.label === 'EUR')
  }

  const createAccountForm = useZodForm({
    schema: createAccountSchema,
    defaultValues: { ...(isUserFirstTime ? defaultValue : {}) }
  })

  useEffect(() => {
    if (isUserFirstTime) {
      setStepIndex(stepIndex + 1)
    }
    createAccountForm.setFocus('name')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <PageHeader title="Create a new account" />
      <Form
        id="createAccountForm"
        form={createAccountForm}
        onSubmit={async (data) => {
          const response = await accountService.create(data)
          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={() => {
                  if (isUserFirstTime) {
                    setRunOnboarding(false)
                  }
                  closeDialog()
                }}
                title="Account created."
                content="Your account was successfully created."
                redirect={`/account/${response.result?.id}`}
                redirectText="View account"
              />
            )
            if (isUserFirstTime) {
              setStepIndex(stepIndex + 1)
              setRunOnboarding(true)
            }
            createAccountForm.reset()
          } else {
            const { errors, message } = response
            createAccountForm.setError('root', { message })

            if (errors) {
              getObjectKeys(errors).map((field) =>
                createAccountForm.setError(field, { message: errors[field] })
              )
            }
          }
        }}
        className="mt-10 max-w-lg"
      >
        <Input
          required
          label="Account name"
          error={createAccountForm.formState?.errors?.name?.message}
          {...createAccountForm.register('name')}
          autoFocus
        />
        <Controller
          name="asset"
          control={createAccountForm.control}
          render={({ field: { value } }) => (
            <Select<SelectOption>
              options={assets}
              label="Asset"
              placeholder="Select asset..."
              error={createAccountForm.formState.errors.asset?.message}
              value={value}
              onChange={(option) => {
                if (option) {
                  createAccountForm.setValue('asset', { ...option })
                }
              }}
            />
          )}
        />
        <Button
          type="submit"
          aria-label="create account"
          loading={createAccountForm.formState.isSubmitting}
        >
          Create account
        </Button>
      </Form>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  assets: SelectOption[]
}> = async (ctx) => {
  const response = await assetService.list(ctx.req.headers.cookie)

  // TODO: https://nextjs.org/docs/advanced-features/custom-error-page#more-advanced-error-page-customizing
  if (!response.success) {
    return {
      notFound: true
    }
  }

  const assets = response.result
    ?.filter((asset) => asset.scale <= BASE_ASSET_SCALE)
    ?.map((asset) => ({
      value: asset.id,
      label: asset.code
    }))

  return {
    props: {
      assets: assets ?? []
    }
  }
}

CreateAccountPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default CreateAccountPage
