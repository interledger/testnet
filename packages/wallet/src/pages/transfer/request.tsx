import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { z } from 'zod'
import Image from 'next/image'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { Badge } from '@/ui/Badge'
import { TransferHeader } from '@/components/TransferHeader'

const requestSchema = z.object({
  paymentPointer: z.string(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  currency: z.string()
})

export default function Request() {
  const requestForm = useZodForm({
    schema: requestSchema
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="turqoise" balance="$15.000" />
        <Form
          form={requestForm}
          onSubmit={(data) => {
            console.log(data)
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...requestForm.register('paymentPointer')}
              error={requestForm.formState.errors.paymentPointer?.message}
              label="Payment pointer"
            />
          </div>
          <Input
            required
            {...requestForm.register('amount')}
            error={requestForm.formState.errors.amount?.message}
            label="Amount"
          />
          <Input
            required
            {...requestForm.register('currency')}
            error={requestForm.formState.errors.currency?.message}
            label="Currency"
          />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={requestForm.formState.isSubmitting}
            >
              Request
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/request.webp"
        alt="Request"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/request-mobile.webp"
        alt="Request"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
