import {
  ApplePayMark,
  GooglePayMark,
  OpenPaymentsMark
} from '@/components/icons.tsx'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button.tsx'
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
import { CartItem, resetCart } from '@/lib/stores/cart-store.ts'

const PAYMENT_HANDLER = 'http://localhost:4003/pay'

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
  const [paymentRequestSupported, setPaymentRequestSupported] = useState<
    boolean | null
  >(null)

  if (data?.result.redirectUrl) {
    resetCart()
    window.location.href = data.result.redirectUrl
  }

  useEffect(() => {
    if (window.PaymentRequest) {
      setPaymentRequestSupported(true)
    }
  }, [])

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
      {paymentRequestSupported && (
        <PaymentRequestApiHandler
          onComplete={(res) => {
            console.log('Payment response', JSON.stringify(res, null, 2))
            const { incomingPaymentId } = res.details
            alert('Payment successful! ' + incomingPaymentId)
            resetCart()
            // MOCK: show an existing order for this demo
            const sampleOrderId = '8b529043-d3cd-4b17-bad6-71806048b63d'
            redirectToConfirmationPage(sampleOrderId, incomingPaymentId)
          }}
        />
      )}

      <InputField
        label="Wallet Address"
        {...form.register('walletAddressUrl')}
      />
      <PayButton className="mt-5 w-full" />
    </Form>
  )
}

function PaymentRequestApiHandler({
  onComplete
}: {
  onComplete: (res: PaymentResponse) => void
}) {
  const location = useLocation()
  const { items } = JSON.parse(location.state) as Summary

  const [request, setRequest] = useState<PaymentRequest>(() =>
    initPaymentRequest(items)
  )

  return (
    <Button
      variant="secondary"
      className="mb-4 w-full"
      aria-label="Buy via Payment Handler"
      type="button"
      onClick={() => {
        void onBuyClicked(request, async (res) => {
          await res.complete('success')
          onComplete(res)
        })
        setRequest(initPaymentRequest(items))
      }}
    >
      Buy via Payment Handler
    </Button>
  )
}

function initPaymentRequest(items: CartItem[]): PaymentRequest {
  const currency: string = import.meta.env.VITE_CURRENCY || 'USD'
  const displayItems = items.map((item) => ({
    label: `${item.name} x${item.quantity}`,
    amount: {
      currency,
      value: (item.price * item.quantity).toFixed(2)
    }
  }))
  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)

  const message = `Purchase at Boutique (${itemCount} items)`
  const receivingWallet = import.meta.env.VITE_PAYMENT_POINTER

  return new PaymentRequest(
    [
      {
        supportedMethods: PAYMENT_HANDLER,
        data: { walletAddress: receivingWallet, message }
      }
    ],
    {
      total: {
        label: message,
        amount: { currency, value: total.toFixed(2) }
      },
      displayItems
    },
    { requestPayerEmail: true } // set to true to see the UI
  )
}

async function onBuyClicked(
  request: PaymentRequest,
  onSuccess: (res: PaymentResponse) => void | Promise<void> = () => {}
) {
  try {
    const paymentResponse = await request.show()
    onSuccess(paymentResponse)
  } catch (err) {
    console.error(err)
    alert('Payment failed: ' + (err as Error).message)
  }
}

// Assume an order was created and redirect to orders page.
// I'm not actually creating an order here for simplicity (as existing code is
// tied to existing payment flow)
function redirectToConfirmationPage(
  orderId: string,
  incomingPaymentId: string
) {
  const redir = new URL('/checkout/confirmation', window.location.origin)
  redir.searchParams.set('orderId', orderId)
  // This incomingPaymentId is from the actual payment response
  redir.searchParams.set('incomingPaymentId', incomingPaymentId)
  window.location.href = redir.href
}
