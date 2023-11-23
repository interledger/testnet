import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Form } from '@/components/ui/form/form'
import { InputField } from '@/components/ui/form/input-field'
import { Button } from '@/components/ui/button'
import { useZodForm } from '@/hooks/use-zod-form'
import { oneClickBuySetupSchema } from '@/app/cart/components/summary'
import { useCustomMutation } from '@/hooks/use-custom-mutation'
import { z } from 'zod'
import { getObjectKeys } from '@/lib/utils'

export const OneClickSetupDialog = () => {
  const form = useZodForm({
    schema: oneClickBuySetupSchema
  })

  const { mutate, data, isPending, isSuccess } = useCustomMutation<
    z.infer<typeof oneClickBuySetupSchema>,
    Record<string, string>,
    {
      walletAddress: string
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
    window.location.href = data.data.redirectUrl
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label="setup one click buy">Setup One Click Buy</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>One Click Buy Setup</DialogTitle>
          <Form
            form={form}
            disabled={form.formState.isSubmitting || isPending || isSuccess}
            onSubmit={form.handleSubmit(({ walletAddress, amount }) => {
              mutate({
                walletAddress,
                amount
              })
            })}
            className="py-4"
          >
            <InputField
              label="Payment pointer"
              {...form.register('walletAddress')}
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
            <Button
              aria-label="submit"
              className="mt-5 w-full"
              disabled={isPending}
            >
              Setup
            </Button>
          </Form>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
