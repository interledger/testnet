import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { TogglePayment } from '@/ui/TogglePayment'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { paySchema, transfersService } from '@/lib/api/transfers'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { getObjectKeys } from '@/utils/helpers'
import { useState } from 'react'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'
import type { NextPageWithLayout } from '@/lib/types/app'

type PayProps = InferGetServerSidePropsType<typeof getServerSideProps>

const PayPage: NextPageWithLayout<PayProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const [balance, setBalance] = useState('')
  const payForm = useZodForm({
    schema: paySchema
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

    payForm.resetField('paymentPointerId', {
      defaultValue: null
    })

    const paymentPointersResponse = await paymentPointerService.list(accountId)
    if (!paymentPointersResponse.success || !paymentPointersResponse.data) {
      setPaymentPointers([])
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Could not load payment pointers. Please try again!"
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
        <TransferHeader type="pink" balance={balance} />
        <Form
          form={payForm}
          onSubmit={async (data) => {
            const response = await transfersService.pay(data)
            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={closeDialog}
                  title="Funds payed."
                  content="Funds were successfully payed."
                  redirect={`/`}
                  redirectText="Go to your accounts"
                />
              )
            } else {
              const { errors, message } = response
              payForm.setError('root', { message })
              if (errors) {
                getObjectKeys(errors).map((field) =>
                  payForm.setError(field, { message: errors[field] })
                )
              }
            }
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="from" />
            <Select<SelectOption>
              options={accounts}
              placeholder="Select account..."
              isSearchable={false}
              onChange={(option) => {
                if (option) {
                  getPaymentPointers(option.value)
                }
              }}
            />
            <Controller
              name="paymentPointerId"
              control={payForm.control}
              render={({ field: { value } }) => (
                <Select<SelectOption>
                  options={paymentPointers}
                  aria-invalid={
                    payForm.formState.errors.paymentPointerId ? 'true' : 'false'
                  }
                  error={payForm.formState.errors.paymentPointerId?.message}
                  placeholder="Select payment pointer..."
                  value={value}
                  onChange={(option) => {
                    if (option) {
                      payForm.setValue('paymentPointerId', { ...option })
                    }
                  }}
                />
              )}
            />
          </div>
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...payForm.register('incomingPaymentUrl')}
              error={payForm.formState.errors.incomingPaymentUrl?.message}
              label="Incoming payment URL"
            />
          </div>
          <div className="space-y-1">
            <TogglePayment disabled={true} type="received" />
            <Input
              required
              {...payForm.register('amount')}
              error={payForm.formState.errors.amount?.message}
              label="Amount"
            />
          </div>
          <Input {...payForm.register('description')} label="Description" />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={payForm.formState.isSubmitting}
            >
              Pay
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/pay.webp"
        alt="Pay"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/pay-mobile.webp"
        alt="Pay"
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
  const response = await accountService.list(ctx.req.headers.cookie)
  if (!response.success) {
    return {
      notFound: true
    }
  }

  const accounts = response.data
    ? response.data.map((account) => ({
        label: `${account.name} (${account.assetCode})`,
        value: account.id,
        balance: account.balance,
        assetCode: account.assetCode
      }))
    : []

  return {
    props: {
      accounts
    }
  }
}

PayPage.getLayout = function (page) {
    return <AppLayout>{page}</AppLayout>
}

export default PayPage
