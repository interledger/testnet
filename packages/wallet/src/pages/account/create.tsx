import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select } from '@/ui/forms/Select'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { z } from 'zod'

const newAccountSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Accout name should be at least 3 characters long.' }),
  asset: z
    .string({ required_error: 'Please select an asset for your account.' })
    .uuid()
})

type CreateAccountProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function CreateAccount({ assets }: CreateAccountProps) {
  const { openDialog, closeDialog } = useDialog()
  const form = useZodForm({
    schema: newAccountSchema
  })

  const onSubmit = form.handleSubmit((data) => {
    console.log(data)
    openDialog(
      <SuccessDialog
        onClose={closeDialog}
        title="Account created."
        content="Your account was successfully created."
        redirect="/account/id"
        redirectText="View account"
      />
    )
  })

  return (
    <AppLayout>
      <PageHeader title="Create a new account" />
      <Form form={form} onSubmit={onSubmit} className="mt-10 max-w-lg">
        <Input
          required
          placeholder="My Account"
          label="Account name"
          error={form.formState?.errors?.name?.message}
          {...form.register('name')}
        />
        <Select
          name="asset"
          setValue={form.setValue}
          defaultValue={assets[0]}
          error={form.formState.errors.asset?.message}
          options={assets}
          label="Asset"
        />
        <Button type="submit" aria-label="create account">
          Create account
        </Button>
      </Form>
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  assets: {
    name: string
    value: string
  }[]
}> = async (_ctx) => {
  return {
    props: {
      assets: [
        { name: 'EUR', value: 'a4ad467b-0ee0-432a-a09b-568b32a0b76a' },
        { name: 'RON', value: 'b4ad467b-0ee0-432a-a09b-568b32a0b76b' },
        { name: 'USD', value: 'c4ad467b-0ee0-432a-a09b-568b32a0b76c' }
      ]
    }
  }
}
