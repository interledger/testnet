import { OpenPaymentsMark } from '@/components/icons.tsx'
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
import { useRef } from 'react'
import { getObjectKeys } from '@/lib/utils.ts'

export const PaymentMethods = () => {
  const contentRef = useRef<HTMLDivElement | null>(null)

  return (
    <Tabs className="py-4 sm:px-6 lg:px-0">
      <h2 className="mb-4 block">Select payment method</h2>
      <TabsList>
        <TabsTrigger value="open-payments" className="space-x-2">
          <OpenPaymentsMark width={50} height={32} />
          <span className="text-sm">Open Payments</span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="open-payments" ref={contentRef}>
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
  const { mutate, data, isLoading } = useCreateOrderMutation({
    onError: function ({ errors }) {
      if (errors) {
        getObjectKeys(errors).map((field) =>
          form.setError(field, {
            message: errors[field]
          })
        )
      }
    }
  })

  if (data?.data.redirectUrl) {
    window.location.href = data.data.redirectUrl
  }

  return (
    <Form
      form={form}
      disabled={form.formState.isSubmitting || isLoading}
      onSubmit={form.handleSubmit(({ paymentPointerUrl }) =>
        mutate({
          paymentPointerUrl,
          products: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity
          }))
        })
      )}
      className="relative my-5 items-center justify-between border-t border-gray-200 pt-6"
    >
      <InputField
        label="Payment pointer"
        {...form.register('paymentPointerUrl')}
      />

      <PayButton className="mt-5 w-full" />
    </Form>
  )
}
