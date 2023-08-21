import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'
import { Account, accountService, exchangeSchema } from '@/lib/api/account'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from './ErrorDialog'
import { getCurrencySymbol, getObjectKeys } from '@/utils/helpers'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { useRouter } from 'next/router'
import { Controller } from 'react-hook-form'
import { Select, SelectOption } from '@/ui/forms/Select'

type ExchangeDialogProps = Pick<DialogProps, 'onClose'> & {
  account: Account
  assets: SelectOption[]
}

export const ExchangeDialog = ({
  onClose,
  account,
  assets
}: ExchangeDialogProps) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()
  const exchangeForm = useZodForm({
    schema: exchangeSchema
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
                  Exchange Money
                </Dialog.Title>
                <div className="px-4">
                  <Form
                    form={exchangeForm}
                    onSubmit={async (data) => {
                      const response = await accountService.exchange(data)

                      if (!response) {
                        openDialog(
                          <ErrorDialog
                            onClose={closeDialog}
                            content="Money exchange failed. Please try again."
                          />
                        )
                        return
                      }

                      if (response.success) {
                        router.replace(router.asPath)
                        closeDialog()
                      } else {
                        const { errors, message } = response

                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            exchangeForm.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                        if (message) {
                          exchangeForm.setError('root', { message })
                        }
                      }
                    }}
                  >
                    <Input
                      required
                      label="Amount"
                      addOn={getCurrencySymbol(account.assetCode)}
                      error={exchangeForm.formState?.errors?.amount?.message}
                      {...exchangeForm.register('amount')}
                    />
                    <Controller
                      name="asset"
                      control={exchangeForm.control}
                      render={({ field: { value } }) => (
                        <Select<SelectOption>
                          options={assets}
                          label="Asset"
                          placeholder="Select asset..."
                          error={exchangeForm.formState.errors.asset?.message}
                          value={value}
                          onChange={(option) => {
                            if (option) {
                              exchangeForm.setValue('asset', { ...option })
                            }
                          }}
                        />
                      )}
                    />
                    <div className="mt-5 flex flex-col justify-between space-y-3 sm:flex-row-reverse sm:space-y-0">
                      <Button
                        aria-label="exchange money"
                        type="submit"
                        loading={exchangeForm.formState.isSubmitting}
                      >
                        Exchange
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
