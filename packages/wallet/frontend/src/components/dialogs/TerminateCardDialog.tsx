import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { UserCardFront } from '../userCards/UserCard'
import { Controller } from 'react-hook-form'
import { Select, SelectOption } from '@/ui/forms/Select'
import { cardService, terminateCardSchema } from '@/lib/api/card'
import { useToast } from '@/lib/hooks/useToast'
import { Card } from '../icons/CardButtons'
import { useCardContext } from '../userCards/UserCardContext'

type TerminateCardDialogProps = Pick<DialogProps, 'onClose'>

export const TerminateCardDialog = ({ onClose }: TerminateCardDialogProps) => {
  const { card } = useCardContext()
  const [, closeDialog] = useDialog()
  const { toast } = useToast()
  const terminateCardForm = useZodForm({
    schema: terminateCardSchema
  })

  const reasons = [
    { value: 'stolen', label: 'Card got stolen' },
    { value: 'lost', label: 'Card got lost' },
    { value: 'not_used', label: 'Card is never used' },
    { value: 'close', label: 'Closing account' }
  ]
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
              <Dialog.Panel className="relative w-full max-w-xl space-y-4 rounded-lg bg-white p-2 shadow-xl dark:bg-purple sm:p-8">
                <Dialog.Title
                  as="h3"
                  className="text-center text-2xl font-bold"
                >
                  Terminate Card
                </Dialog.Title>
                <div className="px-4">
                  <Form
                    form={terminateCardForm}
                    onSubmit={async () => {
                      const response = await cardService.terminate(card.id)

                      if (!response.success) {
                        closeDialog()
                        toast({
                          description: (
                            <p>
                              <Card className="mr-2 inline-flex h-8 w-8 items-center justify-center" />
                              Error while terminating the card. Please try
                              again.
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
                              Card termination was successful.
                            </p>
                          ),
                          variant: 'success'
                        })
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCardFront
                        nameOnCard={card.nameOnCard}
                        isBlocked={card.status === 'Blocked'}
                      />
                      You won&apos;t be able to use this card again. Any
                      deposits, such as car rental or hotel reservation deposits
                      will also be canceled.
                    </div>
                    <Controller
                      name="reason"
                      render={({ field: { value } }) => (
                        <Select<SelectOption>
                          required
                          label="Reason"
                          placeholder="Select reason..."
                          options={reasons}
                          value={value}
                          error={
                            terminateCardForm.formState.errors.reason?.message
                          }
                          onChange={(option) => {
                            if (option) {
                              terminateCardForm.setValue('reason', {
                                ...option
                              })
                            }
                          }}
                        />
                      )}
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
                        aria-label="confirm card termination"
                        type="submit"
                        loading={terminateCardForm.formState.isSubmitting}
                      >
                        Terminate Card
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
