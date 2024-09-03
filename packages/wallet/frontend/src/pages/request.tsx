import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { PageHeader } from '@/components/PageHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { TimeUnit, requestSchema, transfersService } from '@/lib/api/transfers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import {
  formatAmount,
  getObjectKeys,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import { Select, type SelectOption } from '@/ui/forms/Select'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { accountService } from '@/lib/api/account'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useEffect, useMemo, useState } from 'react'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import { Label } from '@/ui/forms/Label'
import { FieldError } from '@/ui/forms/FieldError'
import { useSnapshot } from 'valtio'
import { balanceState } from '@/lib/balance'
import { AssetOP } from '@wallet/shared'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useTheme } from 'next-themes'

type SelectTimeUnitOption = Omit<SelectOption, 'value'> & {
  value: TimeUnit
}
type SelectWalletAddressOption = SelectOption & { url: string }

const timeUnitOptions: SelectTimeUnitOption[] = [
  { value: 's', label: 'second(s)' },
  { value: 'm', label: 'minute(s)' },
  { value: 'h', label: 'hour(s)' },
  { value: 'd', label: 'day(s)' }
]

type RequestProps = InferGetServerSidePropsType<typeof getServerSideProps>

const RequestPage: NextPageWithLayout<RequestProps> = ({ accounts }) => {
  const [openDialog, closeDialog] = useDialog()
  const { isUserFirstTime, setRunOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const [walletAddresses, setWalletAddresses] = useState<
    SelectWalletAddressOption[]
  >([])
  const [selectedAccount, setSelectedAccount] =
    useState<SelectAccountOption | null>(null)
  const { accountsSnapshot } = useSnapshot(balanceState)
  const requestForm = useZodForm({
    schema: requestSchema,
    mode: 'onSubmit'
  })
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

  useEffect(() => {
    if (isUserFirstTime) {
      setStepIndex(stepIndex === 16 ? stepIndex + 2 : stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getWalletAddresses = async (accountId: string) => {
    const selectedAccount = accounts.find(
      (account) => account.value === accountId
    )
    setSelectedAccount(selectedAccount || null)

    requestForm.resetField('walletAddressId', { defaultValue: null })

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
        value: walletAddress.id,
        url: walletAddress.url
      })
    )
    setWalletAddresses(walletAddresses)
  }

  return (
    <>
      <div className="w-full lg:max-w-xl">
        <PageHeader title="Request Money" />
        <TransferHeader type="green" balance={balanceSnapshot} />
        <Form
          className="px-3"
          form={requestForm}
          onSubmit={async (data) => {
            const response = await transfersService.request(data)
            if (response.success) {
              openDialog(
                <SuccessDialog
                  onClose={() => {
                    if (isUserFirstTime) {
                      setRunOnboarding(false)
                    }
                    closeDialog()
                  }}
                  copyToClipboard={response.result?.url}
                  title="Funds requested."
                  content="Funds were successfully requested"
                  size="lg"
                  redirect={`/`}
                  redirectText="Go to your accounts"
                />
              )
              if (isUserFirstTime) {
                setStepIndex(stepIndex + 1)
                setRunOnboarding(true)
              }
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
          <Badge
            size="fixed"
            text="into"
            intent="info"
            className="self-start"
          />
          <div className="space-y-4">
            <Select
              required
              label="Account"
              placeholder="Select account..."
              options={accounts}
              isSearchable={false}
              id="selectAccountRequest"
              onMenuOpen={() => {
                if (isUserFirstTime) {
                  setRunOnboarding(false)
                }
              }}
              onChange={(option) => {
                if (option) {
                  getWalletAddresses(option.value)
                  if (isUserFirstTime) {
                    setStepIndex(stepIndex + 1)
                    setRunOnboarding(true)
                  }
                }
              }}
            />
            <Controller
              name="walletAddressId"
              control={requestForm.control}
              render={({ field: { value } }) => (
                <Select<SelectOption>
                  required
                  label="Payment pointer"
                  options={walletAddresses}
                  aria-invalid={
                    requestForm.formState.errors.walletAddressId
                      ? 'true'
                      : 'false'
                  }
                  error={requestForm.formState.errors.walletAddressId?.message}
                  placeholder="Select payment pointer..."
                  value={value}
                  id="selectWalletAddressRequest"
                  onMenuOpen={() => {
                    if (isUserFirstTime) {
                      setRunOnboarding(false)
                    }
                  }}
                  onChange={(option) => {
                    if (option) {
                      requestForm.setValue('walletAddressId', { ...option })
                      if (isUserFirstTime) {
                        setStepIndex(stepIndex + 1)
                        setRunOnboarding(true)
                      }
                    }
                  }}
                />
              )}
            />
            <Input
              required
              {...requestForm.register('amount')}
              error={requestForm.formState.errors.amount?.message}
              label="Amount"
              id="addAmountRequest"
              onClick={() => {
                if (isUserFirstTime) {
                  setRunOnboarding(false)
                }
              }}
            />
            <Input
              {...requestForm.register('description')}
              label="Description"
            />
            <div className="flex items-center justify-between">
              <Label htmlFor="expiry">Expiry</Label>
              <div className="flex basis-5/6 justify-end space-x-2">
                <Input
                  id="expiry"
                  placeholder="Time amount"
                  type="number"
                  step="1"
                  min="1"
                  {...requestForm.register('expiry')}
                />
                <div className="mt-1">
                  <Controller
                    name="unit"
                    control={requestForm.control}
                    render={({ field: { value } }) => (
                      <Select<SelectTimeUnitOption>
                        isClearable={true}
                        isSearchable={false}
                        className="w-36"
                        placeholder="Unit"
                        options={timeUnitOptions}
                        aria-invalid={
                          requestForm.formState.errors.walletAddressId
                            ? 'true'
                            : 'false'
                        }
                        value={value}
                        onChange={(option, { action }) => {
                          if (option) {
                            requestForm.setValue('unit', { ...option })
                          }
                          if (action === 'clear') {
                            requestForm.resetField('unit')
                          }
                        }}
                      />
                    )}
                  />
                </div>
              </div>
            </div>
            <FieldError error={requestForm.formState.errors.expiry?.message} />
          </div>
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
        className="object-cover"
        src={imageName}
        alt="Request"
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

RequestPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default RequestPage
