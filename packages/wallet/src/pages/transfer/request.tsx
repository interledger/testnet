import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { z } from 'zod'
import Image from 'next/image'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'

const requestSchema = z.object({
  paymentPointer: z.string(),
  amount: z.coerce.number(),
  currency: z.string()
})

export default function Request() {
  const form = useZodForm({
    schema: requestSchema
  })

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="turqoise" balance="$15.000" />
        <Form form={form} onSubmit={handleSubmit}>
          <div className="space-y-1">
            <Badge text="to" />
            <Input
              required
              {...form.register('paymentPointer')}
              error={form.formState.errors.paymentPointer?.message}
              label="Payment pointer"
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
              Request
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="my-auto object-cover md:hidden"
        src="/request.webp"
        alt="Request"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
