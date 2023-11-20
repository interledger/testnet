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
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { walletAddressService } from '@/lib/api/walletAddress'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import {
  INTERLEDGER_WALLET_ADDRESS,
  PAYMENT_RECEIVE,
  PAYMENT_SEND
} from '@/utils/constants'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { QuoteDialog } from '@/components/dialogs/QuoteDialog'
import { AssetOP, assetService, ExchangeRates } from '@/lib/api/asset'
import { ExchangeRate } from '@/components/ExchangeRate'
import { useSnapshot } from 'valtio'
import { balanceState } from '@/lib/balance'

type SendProps = InferGetServerSidePropsType<typeof getServerSideProps>

const SendPage: NextPageWithLayout<SendProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const [walletAddresses, setWalletAddresses] = useState<SelectOption[]>([])
  const [selectedAccount, setSelectedAccount] =
    useState<SelectAccountOption | null>(null)
  const [receiverAssetCode, setReceiverAssetCode] = useState<string | null>(
    null
  )
  const [currentExchangeRates, setCurrentExchangeRates] =
    useState<ExchangeRates>()
  const [convertAmount, setConvertAmount] = useState(0)
  const [isToggleDisabled, setIsToggleDisabled] = useState(false)
  const [incomingPaymentAmount, setIncomingPaymentAmount] = useState(0)
  const { accountsSnapshot } = useSnapshot(balanceState)

  const balanceSnapshot = useMemo(() => {
    if (!selectedAccount) return ''

    const snapshotAccount = accountsSnapshot.find(
      (item) =>
        item.assetCode === selectedAccount.assetCode &&
        item.assetScale === selectedAccount.assetScale
    )
    return formatAmount({
      value: snapshotAccount?.balance || selectedAccount.balance,
      assetCode: selectedAccount.assetCode,
      assetScale: selectedAccount.assetScale
    }).amount
  }, [accountsSnapshot, selectedAccount])

  const sendForm = useZodForm({
    schema: sendSchema,
    defaultValues: {
      paymentType: PAYMENT_SEND,
      receiver: isUserFirstTime ? INTERLEDGER_WALLET_ADDRESS : ''
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

  const onAccountChange = async (accountId: string) => {
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )

    setSelectedAccount(selectedAccount || null)

    sendForm.resetField('walletAddressId', {
      defaultValue: null
    })

    const walletAddressesResponse = await walletAddressService.list(accountId)
    if (!walletAddressesResponse.success || !walletAddressesResponse.data) {
      setWalletAddresses([])
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Could not load payment pointers. Please try again."
        />
      )
      return
    }

    const walletAddresses = walletAddressesResponse.data.walletAddresses.map(
      (walletAddress) => ({
        label: `${walletAddress.publicName} (${walletAddress.url.replace(
          'https://',
          '$'
        )})`,
        value: walletAddress.id
      })
    )
    setWalletAddresses(walletAddresses)

    if (selectedAccount) {
      const ratesResponse = await assetService.getExchangeRates(
        selectedAccount.assetCode
      )

      const receiver = sendForm.getValues('receiver')
      if (receiver.includes('/incoming-payments/') && receiverAssetCode) {
        let value = convertAmount
        if (selectedAccount.assetCode !== receiverAssetCode) {
          const response =
            await assetService.getExchangeRates(receiverAssetCode)
          if (response.success && response.data) {
            value = Number(
              (value * response.data[selectedAccount.assetCode]).toFixed(2)
            )
          }
        } else {
          value = incomingPaymentAmount
        }
        sendForm.setValue('amount', value)
        setConvertAmount(value)
      }

      if (ratesResponse.success && ratesResponse.data) {
        setCurrentExchangeRates(ratesResponse.data)
      }
    }
  }

  const onWalletAddressChange = async (url: string): Promise<void> => {
    if (url === '') {
      setReceiverAssetCode(null)
      return
    }

    if (url.includes('/incoming-payments/')) {
      const response = await transfersService.getIncomingPaymentDetails(url)

      if (response.success && response.data) {
        let value = response.data.value
        setIncomingPaymentAmount(value)
        const responseAssetCode = response.data.assetCode

        if (
          selectedAccount &&
          selectedAccount.assetCode !== responseAssetCode
        ) {
          const ratesResponse =
            await assetService.getExchangeRates(responseAssetCode)

          if (ratesResponse.success && ratesResponse.data) {
            value = Number(
              (value * ratesResponse.data[selectedAccount.assetCode]).toFixed(2)
            )
          }
        }

        sendForm.clearErrors('receiver')
        sendForm.setValue('paymentType', 'receive')
        sendForm.setValue('amount', value)
        sendForm.setValue('description', response.data.description ?? '')

        setReceiverAssetCode(responseAssetCode)
        setConvertAmount(value)
        setIsToggleDisabled(true)
      } else {
        sendForm.setError('receiver', { message: response.message })
        setReceiverAssetCode(null)
      }
    } else {
      const walletAddressAssetCodeResponse =
        await walletAddressService.getExternal(url)
      if (
        !walletAddressAssetCodeResponse.success ||
        !walletAddressAssetCodeResponse.data
      ) {
        setReceiverAssetCode(null)
        return
      }

      setReceiverAssetCode(walletAddressAssetCodeResponse.data.assetCode)
    }

    if (isToggleDisabled) setIsToggleDisabled(false)

    sendForm.setValue('receiver', url)
  }

  const onAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const amount = Number(event.currentTarget.value)
    if (isNaN(amount)) {
      setConvertAmount(0)
    } else {
      setConvertAmount(amount)
    }
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
        <TransferHeader type="violet" balance={balanceSnapshot} />
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
                  onAccountChange(option.value)
                }
              }}
            />
            <Controller
              name="walletAddressId"
              control={sendForm.control}
              render={({ field: { value } }) => (
                <Select<SelectOption>
                  required
                  label="Payment pointer"
                  options={walletAddresses}
                  aria-invalid={
                    sendForm.formState.errors.walletAddressId ? 'true' : 'false'
                  }
                  error={sendForm.formState.errors.walletAddressId?.message}
                  placeholder="Select payment pointer..."
                  value={value}
                  onChange={(option) => {
                    if (option) {
                      sendForm.setValue('walletAddressId', { ...option })
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
                    onChange={onWalletAddressChange}
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
              onChange={(event) => onAmountChange(event)}
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
            <ExchangeRate
              convertAmount={convertAmount}
              currentExchangeRates={currentExchangeRates}
              receiverAssetCode={receiverAssetCode}
              selectedAsset={
                selectedAccount
                  ? {
                      assetCode: selectedAccount?.assetCode,
                      assetScale: selectedAccount?.assetScale
                    }
                  : null
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

type SelectAccountOption = SelectOption &
  AssetOP & {
    balance: string
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
