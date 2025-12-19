import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
import { TransferHeader } from '@/components/TransferHeader'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { sendSchema, transfersService } from '@/lib/api/transfers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import {
  formatAmount,
  getObjectKeys,
  replaceCardWalletAddressDomain,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import { useDialog } from '@/lib/hooks/useDialog'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { walletAddressService } from '@/lib/api/walletAddress'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import { PAYMENT_RECEIVE } from '@/utils/constants'
import { QuoteDialog } from '@/components/dialogs/QuoteDialog'
import { assetService } from '@/lib/api/asset'
import { useSnapshot } from 'valtio'
import { balanceState } from '@/lib/balance'
import { AssetOP } from '@wallet/shared'

type PayProps = InferGetServerSidePropsType<typeof getServerSideProps>

const PayPage: NextPageWithLayout<PayProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()

  const [walletAddresses, setWalletAddresses] = useState<SelectOption[]>([])
  const [selectedAccount, setSelectedAccount] =
    useState<SelectAccountOption | null>(null)
  const [receiverAssetCode, setReceiverAssetCode] = useState<string | null>(
    null
  )

  const [receiveAmount, setReceiveAmount] = useState<string>('')
  const [paymentRequestOrigin, setPaymentRequestOrigin] = useState<string>('')
  const [methodData, setMethodData] = useState<PaymentReadyData['methodData']>()
  const [paymentRequestClient, setPaymentRequestClient] =
    useState<MessageEventSource | null>(null)

  const [receiverPublicName, setReceiverPublicName] = useState('Recipient')
  const [readOnlyNotes, setReadOnlyNotes] = useState(false)

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
      paymentType: PAYMENT_RECEIVE,
      receiver: ''
    }
  })

  const onAccountChange = useCallback(
    async (accountId: string) => {
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
            content="Could not load wallet addresses. Please try again."
          />
        )
        return
      }

      const walletAddresses = walletAddressesResponse.result.map(
        (walletAddress) => ({
          label: `${walletAddress.publicName} (${replaceCardWalletAddressDomain(replaceWalletAddressProtocol(walletAddress.url), walletAddress.isCard)})`,
          value: walletAddress.id
        })
      )
      setWalletAddresses(walletAddresses)
      sendForm.setValue('walletAddressId', walletAddresses[0])
    },
    [accounts, closeDialog, openDialog, sendForm]
  )

  const onWalletAddressChange = useCallback(
    async (url: string): Promise<void> => {
      if (url === '') {
        setReceiverAssetCode(null)
        setReceiverPublicName('Recipient')
        return
      }

      const walletAddressAssetCodeResponse =
        await walletAddressService.getExternal(url)
      if (
        !walletAddressAssetCodeResponse.success ||
        !walletAddressAssetCodeResponse.result
      ) {
        sendForm.setError('receiver', {
          message: 'Please check that the Wallet Address is correct'
        })
        setReceiverAssetCode(null)
        return
      } else {
        sendForm.clearErrors('receiver')
        setReceiverPublicName(walletAddressAssetCodeResponse.result.publicName)
        setReceiverAssetCode(walletAddressAssetCodeResponse.result.assetCode)
      }

      sendForm.setValue('receiver', url)
    },
    [sendForm]
  )

  const onPaymentReady = useCallback(
    (data: PaymentReadyData) => {
      const { total, methodData, paymentRequestOrigin } = data

      setMethodData(methodData)
      setPaymentRequestOrigin(paymentRequestOrigin)

      const amount = Number(total.value)
      sendForm.setValue('amount', amount)

      setReceiveAmount(
        formatAmount({
          assetCode: total.currency,
          value: (amount * 10 ** 2).toFixed(),
          assetScale: 2
        }).amount
      )

      if (methodData.data.message) {
        sendForm.setValue('description', methodData.data.message)
        setReadOnlyNotes(true)
      }

      const receiverAddress = methodData.data.walletAddress
      sendForm.setValue('receiver', receiverAddress)
      onWalletAddressChange(receiverAddress)
    },
    [sendForm, onWalletAddressChange, setReceiveAmount]
  )

  useEffect(() => {
    navigator.serviceWorker.addEventListener('message', async (e) => {
      setPaymentRequestClient(e.source)

      console.log('Message received from service worker:', e.data)
      switch (e.data.type) {
        case 'PAYMENT_IS_READY': {
          onPaymentReady(e.data)
          break
        }
      }
    })

    function pingServiceWorkerToKeepItAlive() {
      navigator.serviceWorker.controller?.postMessage('ping')
    }

    const SERVICE_WORKER_URL = '/service-worker.js'
    // Unregisters the payment app service
    function unregisterPaymentAppServiceWorker() {
      navigator.serviceWorker
        .getRegistration(SERVICE_WORKER_URL)
        .then((registration) => {
          registration!.unregister().then((success) => {
            console.log('Payment app service worker unregistered:', success)
          })
        })
    }

    // When page is loaded, checks for the existence of the service worker.
    navigator.serviceWorker
      .getRegistration(SERVICE_WORKER_URL)
      .then((registration) => {
        if (registration) {
          // Service worker is installed.
          // @ts-expect-error not in lib yet
          if (registration.paymentManager) {
            // Always update the installed service worker.
            void registration.update()
          } else {
            // Not supposed to have a service worker if there is no
            // paymentManager available (feature is now off?). Remove the
            // service worker.
            unregisterPaymentAppServiceWorker()
          }
        }

        const ok = !!registration
        console.log('Payment app service worker is ready.', ok)
      })

    navigator.serviceWorker.controller!.postMessage({
      type: 'WINDOW_IS_READY'
    })

    const ping = setInterval(pingServiceWorkerToKeepItAlive, 60000)
    return () => {
      clearInterval(ping)
    }
  }, [onPaymentReady])

  const handleAcceptQuote = async (id: string, incomingPaymentId: string) => {
    const response = await transfersService.acceptQuote({ quoteId: id })
    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={() => {
            closeDialog()
            paymentRequestClient!.postMessage({
              type: 'PAYMENT_AUTHORIZED',
              paymentMethod: methodData!.supportedMethods,
              details: { incomingPaymentId }
            })
          }}
          title="Money sent."
          content="Money was successfully sent."
          redirectText="Go to your accounts"
        />
      )
    } else {
      openDialog(
        <ErrorDialog onClose={closeDialog} content={response.message} />
      )
    }
  }

  return (
    <Form
      className="p-6"
      form={sendForm}
      onSubmit={async (data) => {
        const assetCode = selectedAccount!.assetCode

        let amount = data.amount
        if (assetCode !== receiverAssetCode) {
          const response = await assetService.getExchangeRates(
            receiverAssetCode!
          )
          if (response.success && response.result) {
            amount = Number((amount * response.result[assetCode]).toFixed(2))
          }
        }

        const response = await transfersService.send({
          ...data,
          amount
        })
        if (response.success) {
          if (response.result) {
            const quoteId = response.result.id
            const incomingPaymentId = response.result.receiver
            openDialog(
              <QuoteDialog
                quote={response.result}
                receiverName={paymentRequestOrigin}
                type="quote"
                onAccept={() => {
                  handleAcceptQuote(quoteId, incomingPaymentId)
                  closeDialog()
                }}
                onClose={closeDialog}
              />
            )
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
      {paymentRequestOrigin && receiveAmount && (
        <p className="text-lg font-light text-center mb-4">
          Payment request for{' '}
          <strong className="font-bold">{receiveAmount}</strong> from{' '}
          <code className="block">{paymentRequestOrigin}</code>
        </p>
      )}

      <div className="space-y-4">
        <Select
          label="Account"
          required
          placeholder="Select account..."
          options={accounts}
          isSearchable={false}
          id="selectAccount"
          onMenuOpen={() => {}}
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
              label="Wallet address"
              options={walletAddresses}
              aria-invalid={
                sendForm.formState.errors.walletAddressId ? 'true' : 'false'
              }
              error={sendForm.formState.errors.walletAddressId?.message}
              placeholder="Select wallet address..."
              value={value}
              id="selectWalletAddress"
              onMenuOpen={() => {}}
              onChange={(option) => {
                if (option) {
                  sendForm.setValue('walletAddressId', { ...option })
                }
              }}
            />
          )}
        />
      </div>

      <TransferHeader type="pink" balance={balanceSnapshot} />

      <div className="flex justify-center gap-6 py-5">
        <Button
          aria-label="Pay"
          type="submit"
          className="w-30"
          loading={sendForm.formState.isSubmitting}
        >
          Review Payment
        </Button>

        <Button
          aria-label="Cancel"
          type="button"
          className="w-20"
          intent="danger"
          onClick={() => {
            paymentRequestClient!.postMessage({ type: 'CANCEL_PAYMENT' })
          }}
        >
          Cancel
        </Button>
      </div>

      <details className="space-y-4">
        <div className="space-y-1">
          <Input
            required
            {...sendForm.register('receiver')}
            error={sendForm.formState.errors.receiver?.message}
            label="Receiver Wallet address"
            id="addRecipientWalletAddress"
            readOnly={true}
          />
          <p className="text-sm">Name: {receiverPublicName}</p>
        </div>

        <input type="hidden" {...sendForm.register('paymentType')} />

        <Input
          required
          {...sendForm.register('amount')}
          error={sendForm.formState.errors.amount?.message}
          label="Amount"
          id="addAmount"
          readOnly={true}
        />

        <Input
          {...sendForm.register('description')}
          label="Description"
          readOnly={readOnlyNotes}
        />
      </details>
    </Form>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: SelectAccountOption[]
}> = async (ctx) => {
  const [accountsResponse] = await Promise.all([
    accountService.list(ctx.req.headers.cookie)
  ])

  if (!accountsResponse.success || !accountsResponse.result) {
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

PayPage.getLayout = function (page) {
  return <>{page}</>
}

export default PayPage

// #region Types

type SelectAccountOption = SelectOption & AssetOP & { balance: string }

type PaymentReadyData = {
  total: PaymentCurrencyAmount
  methodData: {
    supportedMethods: string
    data: { walletAddress: string; message?: string }
  }
  paymentRequestOrigin: string
}

// #endregion
