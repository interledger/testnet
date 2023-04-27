import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { type SelectOption } from '@/ui/forms/Select'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { accountService, createAccountSchema } from '@/lib/api/account'
import { getObjectKeys } from '@/utils/helpers'
import { assetService } from '@/lib/api/asset'
import { Controller } from 'react-hook-form'
import { Select } from '@/ui/forms/Select'

type CreateAccountProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function CreateAccount({ assets }: CreateAccountProps) {
  const [openDialog, closeDialog] = useDialog()
  const createAccountForm = useZodForm({
    schema: createAccountSchema
  })

  return (
    <AppLayout>
      <PageHeader title="Create a new account" />
      <Form
        form={createAccountForm}
        onSubmit={async (data) => {
          const response = await accountService.create(data)

          if (response.success) {
            openDialog(
              <SuccessDialog
                onClose={closeDialog}
                title="Account created."
                content="Your account was successfully created."
                redirect={`/account/${response.data?.id}`}
                redirectText="View account"
              />
            )
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
          placeholder="My Account"
          label="Account name"
          error={createAccountForm.formState?.errors?.name?.message}
          {...createAccountForm.register('name')}
        />
        <Controller
          name="asset"
          control={createAccountForm.control}
          render={({ field: { value } }) => (
            <Select<SelectOption>
              options={assets}
              value={value}
              onChange={(option) => {
                if (option) {
                  createAccountForm.setValue(
                    'asset',
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
        {createAccountForm.formState.errors.asset?.message}
        <Button
          type="submit"
          aria-label="create account"
          loading={createAccountForm.formState.isSubmitting}
        >
          Create account
        </Button>
      </Form>
    </AppLayout>
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

  const assets = response.data?.map((asset) => ({
    value: asset.id,
    label: asset.code
  }))

  return {
    props: {
      assets: assets ?? []
    }
  }
}
