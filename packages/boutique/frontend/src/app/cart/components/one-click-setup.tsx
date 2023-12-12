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
import { getObjectKeys } from '@/lib/utils'
import {
  oneClickBuySetupSchema,
  useSetupOneClickMutation
} from '@/hooks/use-setup-one-click-mutation'

export const OneClickSetupDialog = ({
  buttonClassName
}: {
  buttonClassName?: string
}) => {
  const form = useZodForm({
    schema: oneClickBuySetupSchema
  })

  const { mutate, data, isPending, isSuccess } = useSetupOneClickMutation({
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
  })

  if (data?.data.redirectUrl) {
    window.location.href = data.data.redirectUrl
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button aria-label="setup one click buy" className={buttonClassName}>
          Setup One Click Buy
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>One Click Buy Setup</DialogTitle>
          <Form
            form={form}
            disabled={form.formState.isSubmitting || isPending || isSuccess}
            onSubmit={form.handleSubmit(({ walletAddressUrl, amount }) => {
              mutate({
                walletAddressUrl,
                amount
              })
            })}
            className="py-4"
          >
            <InputField
              label="Wallet address"
              {...form.register('walletAddressUrl')}
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
