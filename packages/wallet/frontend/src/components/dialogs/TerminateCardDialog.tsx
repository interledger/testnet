import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { UserCardFront } from '../userCards/UserCard'
import { cardService, terminateCardSchema } from '@/lib/api/card'
import { useToast } from '@/lib/hooks/useToast'
import { getObjectKeys } from '@/utils/helpers'
import { ICardResponse } from '@wallet/shared'
import { Input } from '@/ui/forms/Input'
import { useRouter } from 'next/router'

type TerminateCardDialogProps = Pick<DialogProps, 'onClose'> & {
  card: ICardResponse
}

export const TerminateCardDialog = ({
  onClose,
  card
}: TerminateCardDialogProps) => {
  const router = useRouter()
  const [, closeDialog] = useDialog()
  const { toast } = useToast()
  const terminateCardForm = useZodForm({
    schema: terminateCardSchema,
    defaultValues: {
      reason: { value: 'UserRequest', label: 'asda' }
    }
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
                    onSubmit={async (data) => {
                      const response = await cardService.terminate(
                        card.id,
                        data
                      )

                      if (response.success) {
                        closeDialog()
                        toast({
                          description: 'Card has been successfully terminated.',
                          variant: 'success'
                        })
                        router.replace(router.pathname)
                      } else {
                        const { errors, message } = response
                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            terminateCardForm.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                        if (message) {
                          terminateCardForm.setError('root', { message })
                        }
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCardFront
                        nameOnCard={`${card.nameOnCard} ${card.walletAddress ? card.walletAddress.replace('https://', '$') : ''}`}
                        isBlocked={false}
                      />
                      <p className="text-center">
                        Are you sure you want to terminate? <br /> You
                        won&apos;t be able to use this card again.{' '}
                      </p>
                    </div>
                    <Input
                      type="password"
                      inputMode="numeric"
                      label="Password"
                      required
                      placeholder="Enter account password"
                      error={
                        terminateCardForm.formState?.errors?.password?.message
                      }
                      {...terminateCardForm.register('password')}
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
                        Terminate card
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
