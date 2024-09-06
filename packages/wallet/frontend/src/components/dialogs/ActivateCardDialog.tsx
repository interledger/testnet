import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { fundAccountSchema } from '@wallet/shared'
import { UserCardFront } from '../userCards/UserCard'
import { cardServiceMock } from '@/lib/api/card'

type ActivateCardDialogProps = Pick<DialogProps, 'onClose'>

export const ActivateCardDialog = ({ onClose }: ActivateCardDialogProps) => {
  const [closeDialog] = useDialog()
  const activateCardForm = useZodForm({
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
              <Dialog.Panel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white p-2 sm:p-8 shadow-xl dark:bg-purple">
                <Dialog.Title
                  as="h3"
                  className="text-center text-2xl font-bold"
                >
                  Card Activation
                </Dialog.Title>
                <div className="px-4">
                  <Form
                    form={activateCardForm}
                    onSubmit={async () => {
                      const response = await cardServiceMock.activate()

                      if (!response.success) {
                        console.error(
                          '[TODO] UPDATE ME - error while activating card'
                        )
                      }

                      if (response.success) {
                        closeDialog
                      }
                    }}
                  >
                    <div className="flex justify-center items-center flex-col gap-2">
                      <UserCardFront />
                      Proceed with activation only if you have received the
                      card, as it will be fully functional and payment ready.
                    </div>
                    <div className="mt-5 flex justify-between">
                      <Button
                        intent="outline"
                        aria-label="close dialog"
                        onClick={() => onClose()}
                      >
                        Cancel
                      </Button>
                      <Button
                        aria-label="confirm card activation"
                        type="submit"
                        loading={activateCardForm.formState.isSubmitting}
                      >
                        Confirm Activation
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
