import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { UserCardFront } from '../userCards/UserCard'
import { activateCardSchema, cardServiceMock } from '@/lib/api/card'
import { useToast } from '@/lib/hooks/useToast'
import { Card } from '../icons/CardButtons'

type ActivateCardDialogProps = Pick<DialogProps, 'onClose'>

export const ActivateCardDialog = ({ onClose }: ActivateCardDialogProps) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [openDialog, closeDialog] = useDialog()
  const { toast } = useToast()
  const activateCardForm = useZodForm({
    schema: activateCardSchema
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
              <Dialog.Panel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white p-2 shadow-xl dark:bg-purple sm:p-8">
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
                      console.log('Submiyted')
                      const response = await cardServiceMock.activate()

                      if (!response.success) {
                        closeDialog()
                        toast({
                          description: (
                            <p>
                              <Card className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
                              Error while activating the card. Please try again.
                            </p>
                          ),
                          variant: 'error'
                        })
                      }

                      if (response.success) {
                        closeDialog()
                        toast({
                          description: (
                            <p>
                              <Card className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
                              Card activation was successful.
                            </p>
                          ),
                          variant: 'success'
                        })
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
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
