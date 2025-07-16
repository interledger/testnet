import { Button } from '@/ui/Button'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { Form } from '@/ui/forms/Form'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Input } from '@/ui/forms/Input'
import {
  walletAddressService,
  updateWalletAddressSchema
} from '@/lib/api/walletAddress'
import { useRouter } from 'next/router'
import { getObjectKeys } from '@/utils/helpers'
import { OPEN_PAYMENTS_HOST } from '@/utils/constants'
import { useDialog } from '@/lib/hooks/useDialog'
import { SuccessDialog } from './SuccessDialog'
import { IWalletAddressResponse } from '@wallet/shared'

type EditWalletAddressDialogProps = Pick<DialogProps, 'onClose'> & {
  walletAddress: IWalletAddressResponse
}

export const EditWalletAddressDialog = ({
  onClose,
  walletAddress
}: EditWalletAddressDialogProps) => {
  const [openDialog, _] = useDialog()
  const router = useRouter()
  const form = useZodForm({
    schema: updateWalletAddressSchema,
    defaultValues: {
      publicName: walletAddress.publicName
    }
  })

  return (
    <Transition show={true} as={Fragment} appear={true}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-green-modal/75 dark:bg-black/75 transition-opacity" />
        </TransitionChild>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <DialogPanel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white dark:bg-purple p-8 shadow-xl">
                <DialogTitle
                  as="h3"
                  className="text-center text-2xl font-medium"
                >
                  Edit Wallet Address{' '}
                  <div className="text-sm">(Payment Pointer)</div>
                </DialogTitle>

                <div className="px-4">
                  <Form
                    form={form}
                    onSubmit={async (data) => {
                      const response = await walletAddressService.update({
                        accountId: walletAddress.accountId,
                        walletAddressId: walletAddress.id,
                        publicName: data.publicName
                      })

                      if (response.success) {
                        openDialog(
                          <SuccessDialog
                            content={response.message}
                            onClose={() => {
                              router.replace(router.asPath)
                              onClose()
                            }}
                          />
                        )
                      } else {
                        const { errors, message } = response
                        form.setError('root', {
                          message
                        })

                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            form.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                      }
                    }}
                  >
                    <Input
                      addOn={OPEN_PAYMENTS_HOST}
                      disabled
                      readOnly
                      value={walletAddress.url.split('/')[1]}
                      label="Wallet Address name"
                    />
                    <Input
                      required
                      label="Public name"
                      error={form.formState?.errors?.publicName?.message}
                      {...form.register('publicName')}
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
                        aria-label="save payment pointer"
                        type="submit"
                        loading={form.formState.isSubmitting}
                      >
                        Save
                      </Button>
                    </div>
                  </Form>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
