import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { requestSchema, transfersService } from '@/lib/api/transfers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { Select, SelectOption } from '@/ui/forms/Select'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { useState } from 'react'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'

type RequestProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Request({ accounts }: RequestProps) {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const [balance, setBalance] = useState('')
  const requestForm = useZodForm({
    schema: requestSchema
  })

  const handleAccountOnChange = async () => {
    const accountId = requestForm.getValues('accountId')
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )
    setBalance(
      selectedAccount
        ? `${selectedAccount.balance} ${selectedAccount.assetCode}`
        : ''
    )
    const paymentPointerResponse = await paymentPointerService.list(accountId)

    if (!paymentPointerResponse.success || !paymentPointerResponse.data) {
      setPaymentPointers([])
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Could not load payment pointers. Please try again"
        />
      )
      return
    }

    const paymentPointers = paymentPointerResponse.data.map(
      (paymentPointer) => ({
        name: `${paymentPointer.publicName} (${paymentPointer.url})`,
        value: paymentPointer.id
      })
    )

    setPaymentPointers(paymentPointers)
  }

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="turqoise" balance={balance} />
        <Form
          form={requestForm}
          onSubmit={async (data) => {
            const response = await transfersService.request(data)

            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  title="Funds requested."
                  content="Funds were successfully requested."
                  redirect={`/`}
                  redirectText="Go to your accounts"
                />
              )
            } else {
              const { errors, message } = response
              requestForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  requestForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Select
              name="accountId"
              setValue={requestForm.setValue}
              error={requestForm.formState.errors.accountId?.message}
              options={accounts}
              onChange={handleAccountOnChange}
              label="Account"
            />
            <Select
              name="paymentPointerId"
              setValue={requestForm.setValue}
              error={requestForm.formState.errors.paymentPointerId?.message}
              options={paymentPointers}
              label="Payment Pointer"
            />
          </div>

          <Input
            required
            {...requestForm.register('amount')}
            error={requestForm.formState.errors.amount?.message}
            label="Amount"
          />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={requestForm.formState.isSubmitting}
            >
              Request
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/request.webp"
        alt="Request"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/request-mobile.webp"
        alt="Request"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}

type SelectAccountOption = SelectOption & { balance: string; assetCode: string }
export const getServerSideProps: GetServerSideProps<{
  accounts: SelectAccountOption[]
}> = async (ctx) => {
  const [accountsResponse] = await Promise.all([
    accountService.list(ctx.req.headers.cookie)
  ])

  if (!accountsResponse.success) {
    return {
      notFound: true
    }
  }

  if (!accountsResponse.data) {
    return {
      notFound: true
    }
  }

  const accounts = accountsResponse.data.map((account) => ({
    name: `${account.name} (${account.assetCode})`,
    value: account.id,
    balance: account.balance,
    assetCode: account.assetCode
  }))

  return {
    props: {
      accounts
    }
  }
}
