import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { DebouncedInput, Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { PageHeader } from '@/components/PageHeader'
import { TogglePayment } from '@/ui/TogglePayment'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { sendSchema, transfersService } from '@/lib/api/transfers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import {
  formatAmount,
  getObjectKeys,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
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
import { assetService, ExchangeRates } from '@/lib/api/asset'
import { ExchangeRate } from '@/components/ExchangeRate'
import { useSnapshot } from 'valtio'
import { balanceState } from '@/lib/balance'
import { useTheme } from 'next-themes'
import { AssetOP } from '@wallet/shared'

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
  const [receiverPublicName, setReceiverPublicName] = useState('Recepient')
  const [currentExchangeRates, setCurrentExchangeRates] =
    useState<ExchangeRates>()
  const [convertAmount, setConvertAmount] = useState(0)
  const [isToggleDisabled, setIsToggleDisabled] = useState(false)
  const [incomingPaymentAmount, setIncomingPaymentAmount] = useState(0)
  const [readOnlyNotes, setReadOnlyNotes] = useState(false)
  const { accountsSnapshot } = useSnapshot(balanceState)
  const theme = useTheme()
  const imageName =
    theme.theme === 'dark'
      ? '/bird-envelope-dark.webp'
      : '/bird-envelope-light.webp'

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
      setStepIndex(stepIndex === 7 ? stepIndex + 2 : stepIndex + 1)
      setRunOnboarding(true)
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
    if (!walletAddressesResponse.success || !walletAddressesResponse.result) {
      setWalletAddresses([])
      openDialog(
        <ErrorDialog
          onClose={closeDialog}
          content="Could not load payment pointers. Please try again."
        />
      )
      return
    }

    const walletAddresses = walletAddressesResponse.result.map(
      (walletAddress) => ({
        label: `${walletAddress.publicName} (${replaceWalletAddressProtocol(walletAddress.url)})`,
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
          if (response.success && response.result) {
            value = Number(
              (value * response.result[selectedAccount.assetCode]).toFixed(2)
            )
          }
        } else {
          value = incomingPaymentAmount
        }
        sendForm.setValue('amount', value)
        setConvertAmount(value)
      }

      if (ratesResponse.success && ratesResponse.result) {
        setCurrentExchangeRates(ratesResponse.result)
      }
    }
  }

  const onWalletAddressChange = async (url: string): Promise<void> => {
    if (url === '') {
      setReceiverAssetCode(null)
      setReadOnlyNotes(false)
      setReceiverPublicName('Recepient')
      return
    }

    if (url.includes('/incoming-payments/')) {
      const response = await transfersService.getIncomingPaymentDetails(url)
      setReceiverPublicName('Recepient')

      if (response.success && response.result) {
        let value = response.result.value
        setIncomingPaymentAmount(value)
        const responseAssetCode = response.result.assetCode

        if (
          selectedAccount &&
          selectedAccount.assetCode !== responseAssetCode
        ) {
          const ratesResponse =
            await assetService.getExchangeRates(responseAssetCode)

          if (ratesResponse.success && ratesResponse.result) {
            value = Number(
              (value * ratesResponse.result[selectedAccount.assetCode]).toFixed(
                2
              )
            )
          }
        }

        sendForm.clearErrors('receiver')
        sendForm.setValue('paymentType', 'receive')
        sendForm.setValue('amount', value)
        sendForm.setValue('description', response.result.description ?? '')
        setReadOnlyNotes(true)
        setReceiverAssetCode(responseAssetCode)
        setConvertAmount(value)
        setIsToggleDisabled(true)
      } else {
        sendForm.setError('receiver', { message: response.message })
        setReceiverAssetCode(null)
        setReadOnlyNotes(false)
      }
    } else {
      const walletAddressAssetCodeResponse =
        await walletAddressService.getExternal(url)

      if (
        !walletAddressAssetCodeResponse.success ||
        !walletAddressAssetCodeResponse.result
      ) {
        setReceiverAssetCode(null)
        return
      }

      setReceiverPublicName(walletAddressAssetCodeResponse.result.publicName)
      setReceiverAssetCode(walletAddressAssetCodeResponse.result.assetCode)
      setReadOnlyNotes(false)
    }

    if (isToggleDisabled) {
      setIsToggleDisabled(false)
    }

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
          onClose={() => closeDialog()}
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
    <div className="w-full lg:max-w-xl">
      <PageHeader title="Send Money" />
      <TransferHeader type="pink" balance={balanceSnapshot} />
      <Form
        className="px-3"
        form={sendForm}
        onSubmit={async (data) => {
          const response = await transfersService.send(data)
          if (response.success) {
            if (response.result) {
              const quoteId = response.result.id
              openDialog(
                <QuoteDialog
                  quote={response.result}
                  receiverName={receiverPublicName}
                  type="quote"
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
        <Badge size="fixed" text="from" intent="info" className="self-start" />
        <div className="space-y-4">
          <Select
            required
            label="Account"
            placeholder="Select account..."
            options={accounts}
            isSearchable={false}
            id="selectAccount"
            onMenuOpen={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
            }}
            onChange={(option) => {
              if (option) {
                onAccountChange(option.value)
                if (isUserFirstTime) {
                  setStepIndex(stepIndex + 1)
                  setRunOnboarding(true)
                }
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
                id="selectWalletAddress"
                onMenuOpen={() => {
                  if (isUserFirstTime) {
                    setRunOnboarding(false)
                  }
                }}
                onChange={(option) => {
                  if (option) {
                    sendForm.setValue('walletAddressId', { ...option })
                    if (isUserFirstTime) {
                      setStepIndex(stepIndex + 1)
                      setRunOnboarding(true)
                    }
                  }
                }}
              />
            )}
          />
        </div>
        <Badge size="fixed" text="to" intent="info" className="self-start" />
        <div className="space-y-4">
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
                  id="addRecipientWalletAddress"
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
            id="addAmount"
            onClick={() => {
              if (isUserFirstTime) {
                setRunOnboarding(false)
              }
            }}
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
          <Input
            {...sendForm.register('description')}
            label="Description"
            disabled={readOnlyNotes}
          />
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
      <Image
        className="object-cover"
        src={imageName}
        alt="Send"
        quality={100}
        width={500}
        height={200}
      />
    </div>
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

  if (!accountsResponse.result) {
    return {
      notFound: true
    }
  }

  const accounts = accountsResponse.result.map((account) => ({
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
