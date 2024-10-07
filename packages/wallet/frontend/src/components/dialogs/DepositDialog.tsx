import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import { useRouter } from 'next/router'
import { getCurrencySymbol, getObjectKeys } from '@/utils/helpers'
import { depositSchema } from '@wallet/shared/src'
import { accountService } from '@/lib/api/account'

type DepositDialogProps = Pick<DialogProps, 'onClose'> & {
  accountId: string
  assetCode: string
}

export const DepositDialog = ({
  onClose,
  accountId,
  assetCode
}: DepositDialogProps) => {
  const router = useRouter()
  const depositForm = useZodForm({
    schema: depositSchema
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
          <div className="fixed inset-0 bg-green-modal/75 transition-opacity dark:bg-black/75" />
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
              <Dialog.Panel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <Dialog.Title
                  as="h3"
                  className="text-center text-2xl font-bold"
                >
                  Deposit to Account
                </Dialog.Title>
                <Form
                  form={depositForm}
                  onSubmit={async (data) => {
                    const response = await accountService.deposit(data)

                    if (response.success) {
                      router.replace(router.asPath)
                      onClose()
                    } else {
                      const { errors, message } = response
                      depositForm.setError('root', {
                        message
                      })

                      if (errors) {
                        getObjectKeys(errors).map((field) =>
                          depositForm.setError(field, {
                            message: errors[field]
                          })
                        )
                      }
                    }
                  }}
                >
                  <input
                    type="hidden"
                    {...depositForm.register('accountId')}
                    value={accountId}
                  />
                  <Input
                    required
                    label="Amount"
                    addOn={getCurrencySymbol(assetCode)}
                    error={depositForm.formState?.errors?.amount?.message}
                    {...depositForm.register('amount')}
                    autoFocus
                  />
                  <div className="mt-5 flex justify-between">
                    <Button
                      intent="outline"
                      aria-label="close dialog"
                      onClick={() => onClose()}
                    >
                      Cancel
                    </Button>
                    <Button
                      aria-label="deposit"
                      type="submit"
                      loading={depositForm.formState.isSubmitting}
                    >
                      Deposit
                    </Button>
                  </div>
                </Form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
