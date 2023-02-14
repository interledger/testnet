import { AppLayout } from '@/components/layouts/AppLayout'
import { Button } from '@/ui/Button'
import { Form, useZodForm } from '@/ui/Form'
import { Input } from '@/ui/Input'
import { z } from 'zod'
import Image from 'next/image'

const sendSchema = z.object({
  fromAccount: z.string(),
  toPaymentPointer: z.string(),
  amount: z.number(),
  currency: z.string()
})

export default function Send() {
  const form = useZodForm({
    schema: sendSchema
  })

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <AppLayout>
      <div className="flex flex-col text-center lg:w-2/3">
        <h2 className="text-xl font-light text-[#9D92D0]">Total balance</h2>
        <h3 className="mb-10 text-3xl font-semibold text-[#9D92D0]">$10,000</h3>
        <Form form={form} onSubmit={handleSubmit}>
          <label className="relative top-4 w-10 rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] text-sm text-white">
            from
          </label>
          <Input
            required
            {...form.register('fromAccount')}
            error={form.formState.errors.fromAccount?.message}
            label="Account"
          />
          <label className="relative top-4 w-10 rounded-md bg-gradient-to-r from-[#92DBCA] to-[#56B1AF] text-sm text-white">
            to
          </label>
          <Input
            required
            {...form.register('toPaymentPointer')}
            error={form.formState.errors.toPaymentPointer?.message}
            label="Payment pointer"
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
              Send
            </Button>
          </div>
        </Form>
      </div>
      <Image
        className="my-auto object-cover md:hidden"
        src="/send.webp"
        alt="Login"
        quality={100}
        width={500}
        height={200}
      />
    </AppLayout>
  )
}
