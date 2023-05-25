import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { DebouncedInput, Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
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
import { NextPageWithLayout } from '@/lib/types/app'
import { PAYMENT_RECEIVE, PAYMENT_SEND } from '@/utils/constants'

type SendProps = InferGetServerSidePropsType<typeof getServerSideProps>

const SendPage: NextPageWithLayout<SendProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const [balance, setBalance] = useState('')
  const sendForm = useZodForm({
    schema: sendSchema,
    defaultValues: {
      paymentType: PAYMENT_SEND
    }
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

    sendForm.resetField('paymentPointerId', {
      defaultValue: null
    })

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
        value: paymentPointer.id
      })
    )
    setPaymentPointers(paymentPointers)
  }

  return (
    <>
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
          <div className="space-y-2">
            <Badge size="fixed" text="from" />
            <Select
              required
              label="Account"
              placeholder="Select account..."
              options={accounts}
              isSearchable={false}
              onChange={(option) => {
                if (option) {
                  getPaymentPointers(option.value)
                }
              }}
            />
            <Controller
              name="paymentPointerId"
              control={sendForm.control}
              render={({ field: { value } }) => (
                <Select<SelectOption>
                  required
                  label="Payment pointer"
                  options={paymentPointers}
                  aria-invalid={
                    sendForm.formState.errors.paymentPointerId
                      ? 'true'
                      : 'false'
                  }
                  error={sendForm.formState.errors.paymentPointerId?.message}
                  placeholder="Select payment pointer..."
                  value={value}
                  onChange={(option) => {
                    if (option) {
                      sendForm.setValue('paymentPointerId', { ...option })
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="space-y-2">
            <Badge size="fixed" text="to" />
            <Controller
              name="toPaymentPointerUrl"
              control={sendForm.control}
              render={({ field: { value, onChange } }) => {
                return (
                  <DebouncedInput
                    required
                    error={
                      sendForm.formState.errors.toPaymentPointerUrl?.message
                    }
                    label="Payment pointer"
                    value={value}
                    onChange={onChange}
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
              labelHint={
                <Controller
                  name="paymentType"
                  defaultValue={PAYMENT_SEND}
                  control={sendForm.control}
                  render={({ field: { onChange, value } }) => {
                    return (
                      <TogglePayment
                        type={value}
                        onChange={(newValue) => {
                          sendForm.setValue(
                            'paymentType',
                            newValue ? PAYMENT_RECEIVE : PAYMENT_SEND
                          )
                          onChange(newValue ? PAYMENT_RECEIVE : PAYMENT_SEND)
                        }}
                      />
                    )
                  }}
                />
              }
            />
            <Input {...sendForm.register('description')} label="Description" />
          </div>
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
    </>
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

SendPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default SendPage
