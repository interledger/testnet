import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { useDialog } from '@/lib/hooks/useDialog'
import { Button } from '@/ui/Button'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select, type SelectOption } from '@/ui/forms/Select'
import type {
  GetServerSideProps,
  InferGetServerSidePropsType
} from 'next/types'
import { accountService, exchangeAssetSchema } from '@/lib/api/account'
import { getCurrencySymbol, getObjectKeys } from '@/utils/helpers'
import { AssetOP, assetService, ExchangeRates } from '@/lib/api/asset'
import { Controller } from 'react-hook-form'
import { NextPageWithLayout } from '@/lib/types/app'
import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { z } from 'zod'
import { ChangeEvent, useState } from 'react'
import { SimpleArrow } from '@/components/icons/Arrow'
import { useRouter } from 'next/router'
import { QuoteDialog } from '@/components/dialogs/QuoteDialog'

type ExchangeAssetProps = InferGetServerSidePropsType<typeof getServerSideProps>
const ExchangeAssetPage: NextPageWithLayout<ExchangeAssetProps> = ({
  assets,
  rates,
  asset
}) => {
  const [openDialog, closeDialog] = useDialog()
  const [receiverAssetCode, setReceiverAssetCode] = useState<string | null>(
    null
  )
  const [convertAmount, setConvertAmount] = useState(0)
  const exchangeAssetForm = useZodForm({
    schema: exchangeAssetSchema
  })
  const router = useRouter()

  const onAmountChange = (event: ChangeEvent<HTMLInputElement>) => {
    const amount = Number(event.currentTarget.value)
    if (isNaN(amount)) {
      setConvertAmount(0)
    } else {
      setConvertAmount(amount)
    }
  }

  const handleAcceptQuote = async (id: string) => {
    const response = await accountService.acceptExchangeQuote({ quoteId: id })
    if (response.success) {
      openDialog(
        <SuccessDialog
          onClose={closeDialog}
          title="Money exchanged."
          content="Money was successfully exchanged."
          redirect={`/`}
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
    <>
      <PageHeader title="Exchange Money" />
      <Form
        id="createAccountForm"
        form={exchangeAssetForm}
        onSubmit={async (data) => {
          const response = await accountService.exchange(data)
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
            } else {
              openDialog(
                <ErrorDialog
                  content="Something went wrong while fetching your quote for the exchange. Please try again."
                  onClose={closeDialog}
                />
              )
            }
          } else {
            const { errors, message } = response
            exchangeAssetForm.setError('root', { message })

            if (errors) {
              getObjectKeys(errors).map((field) =>
                exchangeAssetForm.setError(field, { message: errors[field] })
              )
            }
          }
        }}
        className="mt-10 max-w-lg"
      >
        <Input
          required
          label="Amount"
          addOn={getCurrencySymbol(asset.assetCode)}
          error={exchangeAssetForm.formState?.errors?.amount?.message}
          {...exchangeAssetForm.register('amount')}
          onChange={(event) => onAmountChange(event)}
        />
        <div className="flex flex-1">
          <Controller
            name="asset"
            control={exchangeAssetForm.control}
            render={({ field: { value } }) => (
              <>
                <Select<SelectOption>
                  options={assets}
                  label="Asset"
                  placeholder="Select asset..."
                  error={exchangeAssetForm.formState.errors.asset?.message}
                  value={value}
                  onChange={(option) => {
                    if (option) {
                      exchangeAssetForm.setValue('asset', { ...option })
                      setReceiverAssetCode(option.label)
                    }
                  }}
                />
                <span className="h-9.5 ml-2 mt-7 flex-grow items-center rounded-md border border-turqoise bg-gray-50 px-3 pt-1 text-right text-gray-600">
                  {convertAmount && receiverAssetCode
                    ? (convertAmount * rates[receiverAssetCode]).toFixed(
                        asset.assetScale
                      )
                    : ''}
                </span>
              </>
            )}
          />
        </div>
        {receiverAssetCode && convertAmount ? (
          <p className="mx-2 text-sm text-green">
            Exchange rate: {getCurrencySymbol(asset.assetCode)}&nbsp;
            {rates[asset.assetCode].toFixed(asset.assetScale)}
            &nbsp;
            <SimpleArrow className="inline h-3 w-3" />
            &nbsp;
            {getCurrencySymbol(receiverAssetCode)}&nbsp;
            {rates[receiverAssetCode]}
          </p>
        ) : null}
        <div className="flex justify-evenly pt-5">
          <Button
            aria-label="exchange money"
            type="submit"
            loading={exchangeAssetForm.formState.isSubmitting}
          >
            Exchange
          </Button>
          <Button
            intent="outline"
            aria-label="close dialog"
            onClick={() => {
              router.replace('/')
            }}
          >
            Cancel
          </Button>
        </div>
      </Form>
    </>
  )
}

const querySchema = z.object({
  assetCode: z.string(),
  assetScale: z.string()
})

export const getServerSideProps: GetServerSideProps<{
  assets: SelectOption[]
  rates: ExchangeRates
  asset: AssetOP
}> = async (ctx) => {
  const result = querySchema.safeParse(ctx.query)
  if (!result.success) {
    return { notFound: true }
  }

  const [assetResponse, ratesResponse] = await Promise.all([
    assetService.list(ctx.req.headers.cookie),
    assetService.getExchangeRates(result.data.assetCode)
  ])

  if (!assetResponse.success || !ratesResponse.success) {
    return {
      notFound: true
    }
  }
  const assets = assetResponse.data?.map((asset) => ({
    value: asset.id,
    label: asset.code
  }))

  return {
    props: {
      assets: assets ?? [],
      rates: ratesResponse.data ?? {},
      asset: {
        assetCode: result.data.assetCode,
        assetScale: Number(result.data.assetScale)
      }
    }
  }
}

ExchangeAssetPage.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default ExchangeAssetPage
