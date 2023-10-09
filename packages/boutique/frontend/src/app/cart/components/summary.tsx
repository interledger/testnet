import { Button } from '@/components/ui/button.tsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form/form'
import { InputField } from '@/components/ui/form/input-field'
import { useCartStore } from '@/hooks/use-cart-store.ts'
import { useCustomMutation } from '@/hooks/use-custom-mutation'
import { useZodForm } from '@/hooks/use-zod-form'
import { resetCart } from '@/lib/stores/cart-store'
import { formatPrice, getObjectKeys } from '@/lib/utils.ts'
import { ReactNode, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { z } from 'zod'

const SummarySection = ({ children }: { children: ReactNode }) => {
  return (
    <section className="rounded-lg bg-green-1 px-4 py-6 sm:p-6 lg:p-8">
      {children}
    </section>
  )
}

export const oneClickBuySetupSchema = z.object({
  paymentPointer: z.string(),
  amount: z.coerce.number()
})

export const Summary = () => {
  const { totalAmount, items } = useCartStore()
  const orderSubTotal = useMemo(() => formatPrice(totalAmount), [totalAmount])

  const form = useZodForm({
    schema: oneClickBuySetupSchema
  })

  const { mutate, data, isLoading, isSuccess } = useCustomMutation<
    z.infer<typeof oneClickBuySetupSchema>,
    Record<string, string>,
    {
      paymentPointer: string
      amount: number
    }
  >(
    { endpoint: '/orders/setup-one-click' },
    {
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
    }
  )

  if (data?.data.redirectUrl) {
    resetCart()
    window.location.href = data.data.redirectUrl
  }

  if (totalAmount === 0) return null

  return (
    <div className="mt-16 flex flex-col gap-y-5 lg:col-span-4 lg:mt-0">
      <SummarySection>
        <h2 className="text-lg font-bold">Summary</h2>
        <dl className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <dt>Subtotal</dt>
            <dd className="font-bold">{orderSubTotal}</dd>
          </div>
          <div className=" flex items-center justify-between border-t border-green pt-4">
            <dt>Fees</dt>
            <dd className="text-sm">Fees will be calculated at checkout</dd>
          </div>
          <div className="flex items-center justify-between border-t border-green pt-4">
            <dt>Estimated order total</dt>
            <dd className="font-bold">{orderSubTotal}</dd>
          </div>
        </dl>
        <div className="mt-6 flex">
          <Button aria-label="go to checkout" className="w-full" asChild>
            <Link to="/checkout" state={JSON.stringify({ items, totalAmount })}>
              Checkout
            </Link>
          </Button>
        </div>
      </SummarySection>
      <SummarySection>
        <Dialog>
          <DialogTrigger asChild>
            <Button aria-label="setup one click buy" className="w-full">
              Setup One Click Buy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>One Click Buy Setup</DialogTitle>
              <DialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove your data from our servers.
              </DialogDescription>

              <Form
                form={form}
                disabled={form.formState.isSubmitting || isLoading || isSuccess}
                onSubmit={form.handleSubmit(({ paymentPointer, amount }) => {
                  mutate({
                    paymentPointer,
                    amount
                  })
                })}
                className="py-4"
              >
                <InputField
                  label="Payment pointer"
                  {...form.register('paymentPointer')}
                  className="w-full"
                />
                <InputField
                  inputMode="numeric"
                  label="Amount"
                  step="0.01"
                  type="number"
                  {...form.register('amount')}
                  placeholder="0.00"
                />
                <Button aria-label="submit" className="mt-5 w-full">
                  Setup
                </Button>
              </Form>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </SummarySection>
    </div>
  )
}
