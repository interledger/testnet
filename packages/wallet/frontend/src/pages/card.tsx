import type { GetServerSideProps, InferGetServerSidePropsType } from 'next'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { NextPageWithLayout } from '@/lib/types/app'
import { cardService, orderCardsSchema } from '@/lib/api/card'
import { UserCard } from '@/components/userCards/UserCard'
import { ICardResponse } from '@wallet/shared'
import { walletAddressService } from '@/lib/api/walletAddress'
import { useRouter } from 'next/router'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import {
  replaceCardWalletAddressDomain,
  replaceWalletAddressProtocol
} from '@/utils/helpers'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { CopyButton } from '@/ui/CopyButton'
import { Form } from '@/ui/forms/Form'
import { Button } from '@/ui/Button'
import { Select, type SelectOption } from '@/ui/forms/Select'
import { accountService } from '@/lib/api/account'
import { useState } from 'react'
import { Controller } from 'react-hook-form'

type UserCardPageProps = InferGetServerSidePropsType<typeof getServerSideProps>

const UserCardPage: NextPageWithLayout<UserCardPageProps> = ({
  card,
  accounts
}) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()
  const [walletAddresses, setWalletAddresses] = useState<SelectOption[]>([])

  const orderCardsForm = useZodForm({
    schema: orderCardsSchema
  })

  type orderCardsType = {
    accountId: { value: string; label: string } | null
    walletAddressId: { value: string; label: string } | null
  }

  async function orderCardWithKeys(data: orderCardsType) {
    const response = await cardService.orderCard({
      walletAddressId: data.walletAddressId?.value || '',
      accountId: data.accountId?.value || ''
    })

    if (!response.success) {
      openDialog(
        <ErrorDialog onClose={() => closeDialog()} content={response.message} />
      )
      return
    }

    if (response.success && response.result) {
      const privateKey = response.result.privateKey

      openDialog(
        <SuccessDialog
          title="Success"
          size="lg"
          content={
            <div className="text-base">
              <p>
                Your card was succesfully ordered and the keys for the new card
                were successfully generated.
              </p>
              <div className="mt-4 space-y-2" id="copyKey">
                <pre className="whitespace-pre-wrap rounded-md bg-green-light p-2 text-left text-sm dark:bg-purple-dark">
                  <code className="break-all">{privateKey}</code>
                </pre>
                <div className="space-y-2">
                  <CopyButton
                    ctaText="Copy private key"
                    aria-label="copy private key"
                    value={privateKey}
                    fullWidth
                  />
                  <CopyButton
                    ctaText="Copy base64 encoded private key"
                    aria-label="copy base64 encoded private key"
                    value={btoa(privateKey.trim())}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          }
          onClose={() => {
            closeDialog()
            router.replace(router.asPath)
          }}
        />
      )
    }
  }

  const onAccountChange = async (accountId: string) => {
    orderCardsForm.resetField('walletAddressId', {
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
  }

  return (
    <>
      <div className="flex items-center justify-between md:flex-col md:items-start md:justify-start">
        <PageHeader title="Your Card" />
      </div>
      {card && card.status !== 'TERMINATED' ? (
        <UserCard card={card} />
      ) : (
        <div>
          <span>
            You don&apos;t have a card linked to your account, or you terminated
            your previous card.
            <br /> You can order a new one here and link it to a Wallet Address.
          </span>
          <div className="w-full lg:max-w-xl">
            <Form
              className="px-3 pt-10"
              form={orderCardsForm}
              onSubmit={async (data) => {
                orderCardWithKeys(data)
              }}
            >
              <Controller
                name="accountId"
                control={orderCardsForm.control}
                render={({ field: { value } }) => (
                  <Select
                    required
                    label="Account"
                    options={accounts}
                    placeholder="Select account..."
                    isSearchable={false}
                    error={orderCardsForm.formState.errors.accountId?.message}
                    value={value}
                    id="selectAccount"
                    onChange={(option) => {
                      if (option) {
                        orderCardsForm.setValue('accountId', {
                          ...option
                        })
                        onAccountChange(option.value)
                      }
                    }}
                  />
                )}
              ></Controller>
              <Controller
                name="walletAddressId"
                control={orderCardsForm.control}
                render={({ field: { value } }) => (
                  <Select<SelectOption>
                    required
                    label="Wallet address"
                    options={walletAddresses}
                    aria-invalid={
                      orderCardsForm.formState.errors.walletAddressId
                        ? 'true'
                        : 'false'
                    }
                    error={
                      orderCardsForm.formState.errors.walletAddressId?.message
                    }
                    placeholder="Select wallet address..."
                    value={value}
                    id="selectWalletAddress"
                    onChange={(option) => {
                      if (option) {
                        orderCardsForm.setValue('walletAddressId', {
                          ...option
                        })
                      }
                    }}
                  />
                )}
              />

              <div className="mt-5 flex justify-between">
                <Button
                  intent="outline"
                  aria-label="cancel order"
                  onClick={() => {
                    orderCardsForm.resetField('walletAddressId', {
                      defaultValue: null
                    })
                    orderCardsForm.resetField('accountId', {
                      defaultValue: null
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button
                  aria-label="order card"
                  type="submit"
                  loading={orderCardsForm.formState.isSubmitting}
                >
                  Order card
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  card: ICardResponse | null
  accounts: SelectOption[]
}> = async (ctx) => {
  const response = await cardService.getDetails(ctx.req.headers.cookie)
  const [accountsResponse] = await Promise.all([
    accountService.list(ctx.req.headers.cookie)
  ])

  if (
    !accountsResponse.success ||
    !accountsResponse.result ||
    !response.success ||
    !response.result
  ) {
    return {
      notFound: true
    }
  }

  const accounts = accountsResponse.result.map((account) => ({
    label: `${account.name} (${account.assetCode})`,
    value: account.id
  }))

  let currentCard: ICardResponse | undefined
  if (response.result && response.result.length > 0) {
    const userCards = response.result
    currentCard = userCards.find((card) => card.status !== 'TERMINATED')
    if (currentCard === undefined) {
      currentCard = response.result.find((card) => card.status === 'TERMINATED')
    }
  }

  return {
    props: {
      card: currentCard ? currentCard : null,
      accounts
    }
  }
}

UserCardPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default UserCardPage
