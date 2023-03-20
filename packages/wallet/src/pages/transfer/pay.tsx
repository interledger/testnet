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

const paySchema = z.object({
  fromAccount: z.string(),
  incomingPaymentUrl: z.string(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  currency: z.string()
})

export default function Pay() {
  const payForm = useZodForm({
    schema: paySchema
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="pink" balance="$10.000" />
        <Form
          form={payForm}
          onSubmit={(data) => {
            console.log(data)
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="from" />
            <Select
              name="fromAccount"
              setValue={payForm.setValue}
              error={payForm.formState.errors.fromAccount?.message}
              options={[]}
              label="Account"
            />
          </div>
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...payForm.register('incomingPaymentUrl')}
              error={payForm.formState.errors.incomingPaymentUrl?.message}
              label="Incoming payment URL"
            />
          </div>
          <div className="space-y-1">
            <TogglePayment disabled={true} type="pink" />
            <Input
              required
              {...payForm.register('amount')}
              error={payForm.formState.errors.amount?.message}
              label="Amount"
            />
          </div>
          <Input
            required
            {...payForm.register('currency')}
            error={payForm.formState.errors.currency?.message}
            label="Currency"
          />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={payForm.formState.isSubmitting}
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
