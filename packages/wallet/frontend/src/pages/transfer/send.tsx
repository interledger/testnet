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
import { formatAmount, getObjectKeys } from '@/utils/helpers'
import { useDialog } from '@/lib/hooks/useDialog'
import { useEffect, useState } from 'react'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import {
  INTERLEDGER_PAYMENT_POINTER,
  PAYMENT_RECEIVE,
  PAYMENT_SEND
} from '@/utils/constants'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { QuoteDialog } from '@/components/dialogs/QuoteDialog'

type SendProps = InferGetServerSidePropsType<typeof getServerSideProps>

const SendPage: NextPageWithLayout<SendProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()
  const [paymentPointers, setPaymentPointers] = useState<SelectOption[]>([])
  const [balance, setBalance] = useState('')
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const [isToggleDisabled, setIsToggleDisabled] = useState(false)
  const sendForm = useZodForm({
    schema: sendSchema,
    defaultValues: {
      paymentType: PAYMENT_SEND,
      receiver: isUserFirstTime ? INTERLEDGER_PAYMENT_POINTER : ''
    }
  })

  useEffect(() => {
    if (isUserFirstTime) {
      setTimeout(() => {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }, 500)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getPaymentPointers = async (accountId: string) => {
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )
    setBalance(
      selectedAccount
        ? formatAmount({
            value: selectedAccount.balance,
            assetCode: selectedAccount.assetCode,
            assetScale: selectedAccount.assetScale
          }).amount
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
          content="Could not load payment pointers. Please try again."
        />
      )
      return
    }

    const paymentPointers = paymentPointersResponse.data.map(
      (paymentPointer) => ({
        label: `${paymentPointer.publicName} (${paymentPointer.url.replace(
          'https://',
          '$'
        )})`,
        value: paymentPointer.id
      })
    )
    setPaymentPointers(paymentPointers)
  }

  const onPaymentPointerChange = async (url: string): Promise<void> => {
    if (url === '') return

    if (url.includes('/incoming-payments/')) {
      const response = await transfersService.getIncomingPaymentDetails(url)

      if (response.success && response.data) {
        sendForm.clearErrors('receiver')
        sendForm.setValue('paymentType', 'receive')
        sendForm.setValue('amount', response.data.value)
        sendForm.setValue('description', response.data.description ?? '')
        setIsToggleDisabled(true)
      } else {
        sendForm.setError('receiver', { message: response.message })
      }
    }

    if (isToggleDisabled) setIsToggleDisabled(false)

    sendForm.setValue('receiver', url)
  }

  const handleAcceptQuote = async (id: string) => {
    const response = await transfersService.acceptQuote({ quoteId: id })
    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={() => {
            if (isUserFirstTime) {
              setRunOnboarding(false)
            }
            closeDialog()
          }}
          title="Money sent."
          content="Money was successfully sent."
          redirect={`/`}
          redirectText="Go to your accounts"
        />
      )
      if (isUserFirstTime) {
        setRunOnboarding(true)
      }
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
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
              if (response.data) {
                const quoteId = response.data.id
                openDialog(
                  <QuoteDialog
                    quote={response.data}
                    onAccept={() => {
                      handleAcceptQuote(quoteId)
                      closeDialog
                    }}
                    onClose={closeDialog}
                  />
                )
                if (isUserFirstTime) {
                  setStepIndex(stepIndex + 1)
                  setRunOnboarding(true)
                }
              } else {
                openDialog(
                  <ErrorDialog
                    content="Something went wrong while fetching your quote. Please try again."
                    onClose={closeDialog}
                  />
                )
              }
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
              name="receiver"
              control={sendForm.control}
              render={({ field: { value } }) => {
                return (
                  <DebouncedInput
                    required
                    error={sendForm.formState.errors.receiver?.message}
                    label="Payment pointer or Incoming payment URL"
                    value={value}
                    onChange={onPaymentPointerChange}
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
                        disabled={isToggleDisabled}
                        onChange={(newValue) => {
                          if (isToggleDisabled) {
                            sendForm.setValue('paymentType', PAYMENT_RECEIVE)
                            onChange(PAYMENT_RECEIVE)
                          } else {
                            sendForm.setValue(
                              'paymentType',
                              newValue ? PAYMENT_RECEIVE : PAYMENT_SEND
                            )
                            onChange(newValue ? PAYMENT_RECEIVE : PAYMENT_SEND)
                          }
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
              className="w-30"
              loading={sendForm.formState.isSubmitting}
            >
              Review Payment
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

type SelectAccountOption = SelectOption & {
  balance: string
  assetCode: string
  assetScale: number
}
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
    assetCode: account.assetCode,
    assetScale: account.assetScale
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
