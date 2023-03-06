import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Select } from '@/ui/forms/Select'
import type { DialogProps } from '@/lib/types/dialog'
import { Form, useZodForm } from '@/ui/forms/Form'
import { z } from 'zod'
import { Input } from '@/ui/forms/Input'

type CreatePaymentPointerDialogProps = Pick<DialogProps, 'onClose'> & {
  account?: {
    name: string
    value: string
  }
}

const createPaymentPointerSchema = z.object({
  account: z.string().uuid(),
  paymentPointer: z.string().min(3, {
    message: 'Payment pointer should be at least 3 characters long.'
  }),
  publicName: z.string().min(3, {
    message:
      "Payment pointer's public name should be at least 3 characters long."
  })
})

export const CreatePaymentPointerDialog = ({
  onClose,
  account
}: CreatePaymentPointerDialogProps) => {
  const form = useZodForm({
    schema: createPaymentPointerSchema
  })

  const handleSubmit = form.handleSubmit((data) => {
    console.log(data)
  })

  return (
    <Transition.Root show={true} as={Fragment} appear={true}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gradient-backdrop transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="relative w-full max-w-lg space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl">
                <Dialog.Title
                  as="h3"
                  className="text-center text-2xl font-medium text-green-6"
                >
                  Create Payment Pointer
                </Dialog.Title>

                <div className="px-4">
                  <Form form={form} onSubmit={handleSubmit}>
                    <Select
                      name="account"
                      setValue={form.setValue}
                      defaultValue={account}
                      error={form.formState.errors.account?.message}
                      options={[]}
                      label="Account"
                    />
                    <div>
                      <Input
                        required
                        label="Payment Pointer name"
                        error={form.formState?.errors?.paymentPointer?.message}
                        {...form.register('paymentPointer')}
                      />
                      <p className="ml-2 text-sm text-green">
                        $rafiki.money/{form.watch('paymentPointer')}
                      </p>
                    </div>
                    <Input
                      required
                      label="Public name"
                      error={form.formState?.errors?.publicName?.message}
                      {...form.register('publicName')}
                    />
                    <div className="mt-5 flex flex-col justify-between space-y-3 sm:flex-row-reverse sm:space-y-0">
                      <Button aria-label="create payment pointer" type="submit">
                        Create
                      </Button>
                      <Button
                        intent="outline"
                        aria-label="close dialog"
                        onClick={() => onClose()}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
