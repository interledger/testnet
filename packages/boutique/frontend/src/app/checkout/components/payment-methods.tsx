import {
  ApplePayMark,
  GooglePayMark,
  OpenPaymentsMark
} from '@/components/icons.tsx'
import { Form } from '@/components/ui/form/form.tsx'
import { InputField } from '@/components/ui/form/input-field.tsx'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs.tsx'
import { useZodForm } from '@/hooks/use-zod-form.ts'
import { PayButton } from './pay-button.tsx'
import { useLocation } from 'react-router-dom'
import { Summary } from './order-summary.tsx'
import {
  createOrderSchema,
  useCreateOrderMutation
} from '@/hooks/use-create-order-mutation.ts'
import { getObjectKeys } from '@/lib/utils.ts'
import { resetCart } from '@/lib/stores/cart-store.ts'
import { ProductType } from '@/hooks/use-products-query.ts'
import { formatPrice } from '@/lib/utils.ts'
import { useEffect } from 'react'

type PaymentPlan =
  | 'PAY_IN_FULL'
  | 'INSTALLMENTS_3'
  | 'INSTALLMENTS_6'
  | 'INSTALLMENTS_9'
  | 'INSTALLMENTS_12_DAILY'

const PAYMENT_PLAN_OPTIONS: Array<{
  value: PaymentPlan
  label: string
  helper: string
}> = [
  {
    value: 'PAY_IN_FULL',
    label: 'Pay in full',
    helper: 'One-time payment using the current checkout flow.'
  },
  {
    value: 'INSTALLMENTS_3',
    label: '3 installments',
    helper: 'Three monthly payments with a fixed recurring grant.'
  },
  {
    value: 'INSTALLMENTS_6',
    label: '6 installments',
    helper: 'Six monthly payments with a fixed recurring grant.'
  },
  {
    value: 'INSTALLMENTS_9',
    label: '9 installments',
    helper: 'Nine monthly payments with a fixed recurring grant.'
  },
  {
    value: 'INSTALLMENTS_12_DAILY',
    label: '12 daily installments',
    helper: 'Twelve daily payments with a fixed recurring grant so progress is visible faster.'
  }
]

export const PaymentMethods = () => {
  return (
    <Tabs className="py-4 sm:px-6 lg:px-0">
      <h2 className="mb-4 block font-['DejaVuSansMonoBold']">
        Select payment method
      </h2>
      <TabsList>
        <TabsTrigger
          value="open-payments"
          className="space-x-2 hover:underline dark:hover:no-underline dark:hover:border-pink-neon"
        >
          <OpenPaymentsMark width={120} height={40} />
        </TabsTrigger>
        <TabsTrigger
          value="open-payments"
          className="space-x-2 hover:underline dark:hover:no-underline"
          disabled
        >
          <ApplePayMark width={80} height={40} />
        </TabsTrigger>
        <TabsTrigger
          value="open-payments"
          className="space-x-2 hover:underline dark:hover:no-underline"
          disabled
        >
          <GooglePayMark width={120} height={40} />
        </TabsTrigger>
      </TabsList>
      <TabsContent value="open-payments">
        <OpenPaymentsForm />
      </TabsContent>
    </Tabs>
  )
}

const OpenPaymentsForm = () => {
  const location = useLocation()
  const { items } = JSON.parse(location.state) as Summary
  const form = useZodForm({
    schema: createOrderSchema,
    defaultValues: {
      paymentPlan: 'PAY_IN_FULL'
    }
  })
  const { mutate, data, isPending, isSuccess } = useCreateOrderMutation({
    onError: function ({ message, errors }) {
      if (errors) {
        getObjectKeys(errors).map((field) =>
          form.setError(field, {
            message: errors[field]
          })
        )
      } else {
        form.setError('root', { message })
      }
    }
  })
  const selectedPaymentPlan = form.watch('paymentPlan')
  const isInstallmentEligible =
    items.length === 1 && items[0].productType === ProductType.ONE_TIME

  const getInstallmentCount = (paymentPlan: PaymentPlan): number | undefined => {
    switch (paymentPlan) {
      case 'INSTALLMENTS_3':
        return 3
      case 'INSTALLMENTS_6':
        return 6
      case 'INSTALLMENTS_9':
        return 9
      case 'INSTALLMENTS_12_DAILY':
        return 12
      default:
        return undefined
    }
  }

  const getInstallmentPeriodLabel = (paymentPlan: PaymentPlan): string => {
    switch (paymentPlan) {
      case 'INSTALLMENTS_12_DAILY':
        return 'day'
      case 'PAY_IN_FULL':
        return ''
      default:
        return 'month'
    }
  }

  const isPlanAvailable = (paymentPlan: PaymentPlan): boolean => {
    if (paymentPlan === 'PAY_IN_FULL') {
      return true
    }

    if (!isInstallmentEligible) {
      return false
    }

    const installmentCount = getInstallmentCount(paymentPlan)

    if (!installmentCount) {
      return false
    }

    return Math.round((items[0].price * items[0].quantity + Number.EPSILON) * 100) % installmentCount === 0
  }

  useEffect(() => {
    if (!isPlanAvailable(selectedPaymentPlan)) {
      form.setValue('paymentPlan', 'PAY_IN_FULL')
    }
  }, [form, selectedPaymentPlan, isInstallmentEligible, items])

  if (data?.result.redirectUrl) {
    resetCart()
    window.location.href = data.result.redirectUrl
  }

  return (
    <Form
      form={form}
      disabled={form.formState.isSubmitting || isPending || isSuccess}
      onSubmit={form.handleSubmit(({ walletAddressUrl }) =>
        mutate({
          walletAddressUrl,
          paymentPlan: form.getValues('paymentPlan'),
          products: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      )}
      className="relative my-5 items-center justify-between border-t border-green dark:border-pink-neon pt-6"
    >
      <div className="rounded-md border border-green dark:border-pink-neon p-4">
        <h3 className="font-['DejaVuSansMonoBold']">Choose how to pay</h3>
        <div className="mt-3 grid gap-2">
          {PAYMENT_PLAN_OPTIONS.map((option) => {
            const installmentCount = getInstallmentCount(option.value)
            const isSelected = selectedPaymentPlan === option.value
            const isAvailable = isPlanAvailable(option.value)
            const perPaymentAmount = installmentCount
              ? formatPrice(items[0].price * items[0].quantity / installmentCount)
              : undefined
            const periodLabel = getInstallmentPeriodLabel(option.value)

            return (
              <button
                key={option.value}
                type="button"
                disabled={!isAvailable}
                aria-label={option.label}
                onClick={() =>
                  form.setValue('paymentPlan', option.value, {
                    shouldDirty: true,
                    shouldTouch: true
                  })
                }
                className={[
                  'rounded-md border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-green-dark bg-green-light dark:border-pink-neon dark:bg-purple-dark'
                    : 'border-green dark:border-pink-neon',
                  !isAvailable ? 'cursor-not-allowed opacity-60' : ''
                ].join(' ')}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-['DejaVuSansMonoBold']">{option.label}</span>
                  {perPaymentAmount ? (
                    <span className="text-sm">
                      {perPaymentAmount}
                      {periodLabel ? ` / ${periodLabel}` : ''}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-light">{option.helper}</p>
              </button>
            )
          })}
        </div>

        {!isInstallmentEligible ? (
          <p className="mt-3 text-sm font-light">
            Installments are only available when checkout contains exactly one one-time product.
          </p>
        ) : null}
      </div>

      <InputField
        label="Wallet Address"
        {...form.register('walletAddressUrl')}
      />
      <PayButton className="mt-5 w-full" />
    </Form>
  )
}
