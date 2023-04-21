import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select, SelectOption } from '@/ui/forms/Select'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { TogglePayment } from '@/ui/TogglePayment'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { sendSchema, transfersService } from '@/lib/api/transfers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { useDialog } from '@/lib/hooks/useDialog'
import { useState } from 'react'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'

type SendProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Send({ accounts }: SendProps) {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const [balance, setBalance] = useState('')
  const sendForm = useZodForm({
    schema: sendSchema,
    defaultValues: {
      paymentType: 'sent'
    }
  })

  const handleAccountOnChange = async () => {
    const accountId = sendForm.getValues('accountId')
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )
    setBalance(
      selectedAccount
        ? `${selectedAccount.balance} ${selectedAccount.assetCode}`
        : ''
    )
    const paymentPointerResponse = await paymentPointerService.list(
      sendForm.getValues('accountId')
    )

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
        <TransferHeader type="violet" balance={balance} />
        <Form
          form={sendForm}
          onSubmit={async (data) => {
            const response = await transfersService.send(data)

            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  title="Funds sent."
                  content="Funds were successfully sent."
                  redirect={`/`}
                  redirectText="Go to your accounts"
                />
              )
            } else {
              const { errors, message } = response
              sendForm.setError('root', { message })

              if (errors) {
                getObjectKeys(errors).map((field) =>
                  sendForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="from" />
            <Select
              name="accountId"
              setValue={sendForm.setValue}
              error={sendForm.formState.errors.accountId?.message}
              options={accounts}
              onChange={handleAccountOnChange}
              label="Account"
            />
            <Select
              name="paymentPointerId"
              setValue={sendForm.setValue}
              error={sendForm.formState.errors.paymentPointerId?.message}
              options={paymentPointers}
              label="Payment Pointer"
            />
          </div>
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...sendForm.register('toPaymentPointerUrl')}
              error={sendForm.formState.errors.toPaymentPointerUrl?.message}
              label="Payment pointer"
            />
          </div>
          <div className="space-y-1">
            <Controller
              name="paymentType"
              defaultValue="sent"
              control={sendForm.control}
              render={({ field: { onChange, value } }) => {
                return (
                  <TogglePayment
                    type={value}
                    onChange={(newValue) => {
                      sendForm.setValue(
                        'paymentType',
                        newValue ? 'received' : 'sent'
                      )
                      onChange(newValue ? 'received' : 'sent')
                    }}
                  />
                )
              }}
            />
            <input type="hidden" {...sendForm.register('paymentType')} />
            <Input
              required
              {...sendForm.register('amount')}
              error={sendForm.formState.errors.amount?.message}
              label="Amount"
            />
          </div>
          <Input {...sendForm.register('description')} label="Description" />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={sendForm.formState.isSubmitting}
            >
              Send
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/send.webp"
        alt="Send"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/send-mobile.webp"
        alt="Send"
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
