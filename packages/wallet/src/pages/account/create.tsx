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
import { accountService, createAccountSchema } from '@/lib/api/account'
import { getObjectKeys } from '@/utils/helpers'
import { assetService } from '@/lib/api/asset'
import { useState } from 'react'

type CreateAccountProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function CreateAccount({ assets }: CreateAccountProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [openDialog, closeDialog] = useDialog()
  const form = useZodForm({
    schema: createAccountSchema
  })

  return (
    <AppLayout>
      <PageHeader title="Create a new account" />
      <Form
        form={form}
        onSubmit={async (data) => {
          setIsLoading(true)
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
            form.reset()
          } else {
            const { errors, message } = response
            form.setError('root', { message })

            if (errors) {
              getObjectKeys(errors).map((field) =>
                form.setError(field, { message: errors[field] })
              )
            }
          }
          setIsLoading(false)
        }}
        className="mt-10 max-w-lg"
      >
        <Input
          required
          placeholder="My Account"
          label="Account name"
          error={form.formState?.errors?.name?.message}
          {...form.register('name')}
        />
        <Select
          name="assetRafikiId"
          setValue={form.setValue}
          defaultValue={assets[0]}
          error={form.formState.errors.assetRafikiId?.message}
          options={assets}
          label="Asset"
        />
        <Button type="submit" aria-label="create account" loading={isLoading}>
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
    name: asset.code,
    value: asset.id
  }))

  return {
    props: {
      assets: assets ?? []
    }
  }
}
