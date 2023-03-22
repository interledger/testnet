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

type SendProps = InferGetServerSidePropsType<typeof getServerSideProps>

export default function Send({ accounts }: SendProps) {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const sendForm = useZodForm({
    schema: sendSchema
  })

  const handleAccountOnChange = async () => {
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
        <TransferHeader type="violet" balance="$10.000" />
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
              {...sendForm.register('toPaymentPointer')}
              error={sendForm.formState.errors.toPaymentPointer?.message}
              label="Payment pointer"
            />
          </div>
          <div className="space-y-1">
            <TogglePayment type="violet" />
            <Input
              required
              {...sendForm.register('amount')}
              error={sendForm.formState.errors.amount?.message}
              label="Amount"
            />
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
    </AppLayout>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: SelectOption[]
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
    value: account.id
  }))

  return {
    props: {
      accounts
    }
  }
}
