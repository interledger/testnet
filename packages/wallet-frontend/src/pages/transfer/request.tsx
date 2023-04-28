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
import { Controller } from 'react-hook-form'

type RequestProps = InferGetServerSidePropsType<typeof getServerSideProps>

function getIncomingPaymentUrl(
  paymentId: string,
  paymentPointers: SelectPaymentPointerOption[],
  paymentPointerId: string
): string {
  return `${
    paymentPointers.find(
      (paymentPointer) => paymentPointer.value === paymentPointerId
    )?.url
  }/incoming-payments/${paymentId}`
}

type SelectPaymentPointerOption = SelectOption & { url: string }
export default function Request({ accounts }: RequestProps) {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<
    SelectPaymentPointerOption[]
  >([])
  const [balance, setBalance] = useState('')
  const requestForm = useZodForm({
    schema: requestSchema
  })

  const getPaymentPointers = async (accountId: string) => {
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )
    setBalance(
      selectedAccount
        ? `${selectedAccount.balance} ${selectedAccount.assetCode}`
        : ''
    )

    requestForm.resetField('paymentPointerId', { defaultValue: null })

    const paymentPointersResponse = await paymentPointerService.list(accountId)
    if (!paymentPointersResponse.success || !paymentPointersResponse.data) {
      setPaymentPointers([])
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Could not load payment pointers. Please try again"
        />
      )
      return
    }

    const paymentPointers = paymentPointersResponse.data.map(
      (paymentPointer) => ({
        label: `${paymentPointer.publicName} (${paymentPointer.url})`,
        value: paymentPointer.id,
        url: paymentPointer.url
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
                  copyToClipboard={getIncomingPaymentUrl(
                    response.data?.paymentId || '',
                    paymentPointers,
                    requestForm.getValues('paymentPointerId.value')
                  )}
                  title="Funds requested."
                  content="Funds were successfully requested"
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
              placeholder="Select account..."
              options={accounts}
              onChange={(option) => {
                if (option) {
                  getPaymentPointers(option.value)
                }
              }}
            />
            <Controller
              name="paymentPointerId"
              control={requestForm.control}
              render={({ field: { value } }) => (
                <Select<SelectOption>
                  options={paymentPointers}
                  aria-invalid={
                    requestForm.formState.errors.paymentPointerId
                      ? 'true'
                      : 'false'
                  }
                  error={requestForm.formState.errors.paymentPointerId?.message}
                  placeholder="Select payment pointer..."
                  value={value}
                  onChange={(option) => {
                    if (option) {
                      requestForm.setValue('paymentPointerId', { ...option })
                    }
                  }}
                />
              )}
            />
          </div>
          <Input
            required
            {...requestForm.register('amount')}
            error={requestForm.formState.errors.amount?.message}
            label="Amount"
          />
          <Input {...requestForm.register('description')} label="Description" />
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
    label: `${account.name} (${account.assetCode})`,
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
