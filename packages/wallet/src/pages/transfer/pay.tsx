import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { z } from 'zod'
import Image from 'next/image'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select } from '@/ui/forms/Select'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'

const paySchema = z.object({
  fromAccount: z.string(),
  incomingPaymentUrl: z.string(),
  amount: z.coerce.number(),
  currency: z.string()
})

export default function Pay() {
  const form = useZodForm({
    schema: paySchema
  })

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="pink" balance="$10.000" />
        <Form form={form} onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Badge text="from" />
            <Select
              name="fromAccount"
              setValue={form.setValue}
              error={form.formState.errors.fromAccount?.message}
              options={[]}
              label="Account"
            />
          </div>
          <div className="space-y-1">
            <Badge text="to" />
            <Input
              required
              {...form.register('incomingPaymentUrl')}
              error={form.formState.errors.incomingPaymentUrl?.message}
              label="Incoming payment URL"
            />
          </div>
          <Input
            required
            {...form.register('amount')}
            error={form.formState.errors.amount?.message}
            label="Amount"
          />
          <Input
            required
            {...form.register('currency')}
            error={form.formState.errors.currency?.message}
            label="Currency"
          />
          <div className="flex justify-center py-5">
            <Button aria-label="Pay" type="submit" className="w-24">
              Pay
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="my-auto object-cover md:hidden"
        src="/pay.webp"
        alt="Pay"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
