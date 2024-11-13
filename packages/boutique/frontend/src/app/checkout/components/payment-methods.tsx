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
    schema: createOrderSchema
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
          products: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      )}
      className="relative my-5 items-center justify-between border-t border-green dark:border-pink-neon pt-6"
    >
      <InputField
        label="Payment pointer"
        {...form.register('walletAddressUrl')}
      />
      <PayButton className="mt-5 w-full" />
    </Form>
  )
}
