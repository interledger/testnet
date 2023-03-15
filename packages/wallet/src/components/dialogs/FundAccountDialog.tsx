import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Select } from '@/ui/forms/Select'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'
import { accountService, fundAccountSchema } from '@/lib/api/account'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from './ErrorDialog'
import { getObjectKeys } from '@/utils/helpers'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { AccountSelectOption } from '@/pages/account/[accountId]'

type FundAccountDialogProps = Pick<DialogProps, 'onClose'> & {
  defaultValue?: AccountSelectOption
  accounts: AccountSelectOption[]
}

export const FundAccountDialog = ({
  onClose,
  defaultValue,
  accounts
}: FundAccountDialogProps) => {
  const [openDialog, closeDialog] = useDialog()
  const fundAccountForm = useZodForm({
    schema: fundAccountSchema
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
                  Fund Account
                </Dialog.Title>
                <div className="px-4">
                  <Form
                    form={fundAccountForm}
                    onSubmit={async (data) => {
                      const response = await accountService.fund(data)

                      if (!response) {
                        openDialog(
                          <ErrorDialog
                            onClose={closeDialog}
                            content="Fund Account failed. Please try again"
                          />
                        )
                        return
                      }

                      if (response.success) {
                        closeDialog()
                      } else {
                        const { errors, message } = response

                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            fundAccountForm.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                        if (message) {
                          fundAccountForm.setError('root', { message })
                        }
                      }
                    }}
                  >
                    <Select
                      name="accountId"
                      setValue={fundAccountForm.setValue}
                      defaultValue={defaultValue}
                      error={
                        fundAccountForm.formState.errors.accountId?.message
                      }
                      options={accounts}
                      label="Account"
                    />
                    <div className="flex items-center">
                      <div className="mr-1 grow">
                        <Input
                          required
                          label="Amount"
                          defaultValue={100}
                          error={
                            fundAccountForm.formState?.errors?.amount?.message
                          }
                          {...fundAccountForm.register('amount')}
                        />
                      </div>
                      <input
                        type="hidden"
                        {...fundAccountForm.register('assetCode')}
                        value={defaultValue?.assetCode}
                      />
                      <span className="inline-flex h-8 w-10 items-center justify-center rounded-md border border-turqoise bg-white font-bold text-turqoise">
                        {defaultValue?.assetCode}
                      </span>
                    </div>
                    <div className="mt-5 flex flex-col justify-between space-y-3 sm:flex-row-reverse sm:space-y-0">
                      <Button aria-label="fund account" type="submit">
                        Fund
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
