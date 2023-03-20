import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { z } from 'zod'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Select } from '@/ui/forms/Select'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'
import { TogglePayment } from '@/ui/TogglePayment'
import { useState } from 'react'

const paySchema = z.object({
  fromAccount: z.string(),
  incomingPaymentUrl: z.string(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  currency: z.string()
})

export default function Pay() {
  const [isLoading, setIsLoading] = useState(false)
  const form = useZodForm({
    schema: paySchema
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="pink" balance="$10.000" />
        <Form
          form={form}
          onSubmit={(data) => {
            setIsLoading(true)
            console.log(data)
            setIsLoading(false)
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="from" />
            <Select
              name="fromAccount"
              setValue={form.setValue}
              error={form.formState.errors.fromAccount?.message}
              options={[]}
              label="Account"
            />
          </div>
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...form.register('incomingPaymentUrl')}
              error={form.formState.errors.incomingPaymentUrl?.message}
              label="Incoming payment URL"
            />
          </div>
          <div className="space-y-1">
            <TogglePayment disabled={true} type="pink" />
            <Input
              required
              {...form.register('amount')}
              error={form.formState.errors.amount?.message}
              label="Amount"
            />
          </div>
          <Input
            required
            {...form.register('currency')}
            error={form.formState.errors.currency?.message}
            label="Currency"
          />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={isLoading}
            >
              Pay
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/pay.webp"
        alt="Pay"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/pay-mobile.webp"
        alt="Pay"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
