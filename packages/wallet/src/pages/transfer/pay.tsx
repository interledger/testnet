import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { z } from 'zod'
import Image from 'next/image'
import { Form, useZodForm } from '@/ui/forms/Form'
import { Input } from '@/ui/forms/Input'
import { Select } from '@/ui/forms/Select'

const paySchema = z.object({
  fromAccount: z.string(),
  incomingPaymentPointer: z.string(),
  amount: z.number(),
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
      <div className="flex flex-col text-center lg:w-2/3">
        <h2 className="text-xl font-light text-brand-pink">Total balance</h2>
        <h3 className="mb-10 text-3xl font-semibold text-brand-pink">
          $10,000
        </h3>
        <Form form={form} onSubmit={handleSubmit}>
          <label className="relative top-3 w-10 rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] text-sm text-white">
            from
          </label>
          <Select
            name="fromAccount"
            setValue={form.setValue}
            error={form.formState.errors.fromAccount?.message}
            options={[]}
            label="Account"
          />
          <label className="relative top-4 w-10 rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] text-sm text-white">
            to
          </label>
          <Input
            required
            {...form.register('incomingPaymentPointer')}
            error={form.formState.errors.incomingPaymentPointer?.message}
            label="Incoming payment URL"
          />
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
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
