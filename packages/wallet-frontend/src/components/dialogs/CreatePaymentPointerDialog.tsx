import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import {
  createPaymentPointerSchema,
  paymentPointerService
} from '@/lib/api/paymentPointer'
import { useRouter } from 'next/router'
import { getObjectKeys } from '@/utils/helpers'
import { OPEN_PAYMENTS_HOST } from '@/utils/constants'

type CreatePaymentPointerDialogProps = Pick<DialogProps, 'onClose'> & {
  accountName: string
}

export const CreatePaymentPointerDialog = ({
  onClose,
  accountName
}: CreatePaymentPointerDialogProps) => {
  const router = useRouter()
  const createPaymentPointerForm = useZodForm({
    schema: createPaymentPointerSchema
  })

  const accountId = router.query.accountId as string

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
                  <Form
                    form={createPaymentPointerForm}
                    onSubmit={async (data) => {
                      const response = await paymentPointerService.create(
                        accountId,
                        data
                      )

                      if (response.success) {
                        onClose()
                        router.reload()
                      } else {
                        const { errors, message } = response
                        createPaymentPointerForm.setError('root', {
                          message
                        })

                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            createPaymentPointerForm.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                      }
                    }}
                  >
                    <Input value={accountName} label="Account" readOnly />
                    <div>
                      <Input
                        required
                        label="Payment Pointer name"
                        error={
                          createPaymentPointerForm.formState?.errors
                            ?.paymentPointerName?.message
                        }
                        {...createPaymentPointerForm.register(
                          'paymentPointerName'
                        )}
                      />
                      <p className="ml-2 text-sm text-green">
                        {OPEN_PAYMENTS_HOST}
                        {createPaymentPointerForm.watch('paymentPointerName')}
                      </p>
                    </div>
                    <Input
                      required
                      label="Public name"
                      error={
                        createPaymentPointerForm.formState?.errors?.publicName
                          ?.message
                      }
                      {...createPaymentPointerForm.register('publicName')}
                    />
                    <div className="mt-5 flex flex-col justify-between space-y-3 sm:flex-row-reverse sm:space-y-0">
                      <Button
                        aria-label="create payment pointer"
                        type="submit"
                        loading={
                          createPaymentPointerForm.formState.isSubmitting
                        }
                      >
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
