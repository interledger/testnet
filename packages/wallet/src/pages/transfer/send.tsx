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

const sendSchema = z.object({
  fromAccount: z.string(),
  toPaymentPointer: z.string(),
  amount: z.coerce.number({
    invalid_type_error: 'Please enter a valid amount'
  }),
  currency: z.string()
})

export default function Send() {
  const sendForm = useZodForm({
    schema: sendSchema
  })

  return (
    <AppLayout>
      <div className="flex flex-col lg:w-2/3">
        <TransferHeader type="violet" balance="$10.000" />
        <Form
          form={sendForm}
          onSubmit={(data) => {
            console.log(data)
          }}
        >
          <div className="space-y-1">
            <Badge size="fixed" text="from" />
            <Select
              name="fromAccount"
              setValue={sendForm.setValue}
              error={sendForm.formState.errors.fromAccount?.message}
              options={[]}
              label="Account"
            />
          </div>
          <div className="space-y-1">
            <Badge size="fixed" text="to" />
            <Input
              required
              {...sendForm.register('toPaymentPointer')}
              error={sendForm.formState.errors.toPaymentPointer?.message}
              label="Payment pointer"
            />
          </div>
          <div className="space-y-1">
            <TogglePayment type="violet" />
            <Input
              required
              {...sendForm.register('amount')}
              error={sendForm.formState.errors.amount?.message}
              label="Amount"
            />
          </div>
          <Input
            required
            {...sendForm.register('currency')}
            error={sendForm.formState.errors.currency?.message}
            label="Currency"
          />
          <div className="flex justify-center py-5">
            <Button
              aria-label="Pay"
              type="submit"
              className="w-24"
              loading={sendForm.formState.isSubmitting}
            >
              Send
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="mt-10 hidden object-cover md:block"
        src="/send.webp"
        alt="Send"
        quality={100}
        width={600}
        height={200}
      />
      <Image
        className="my-auto object-cover md:hidden"
        src="/send-mobile.webp"
        alt="Send"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
