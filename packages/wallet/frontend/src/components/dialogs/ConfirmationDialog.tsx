import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { Warning } from '../icons/Warning'

type ConfirmationDialogProps = Pick<DialogProps, 'onClose'> & {
  onConfirm: () => void
  message?: string
  confirmText?: string
}

// TODO: Dialog abstraction that can be used to create different type of dialogs
export const ConfirmationDialog = ({
  onClose,
  onConfirm,
  message,
  confirmText
}: ConfirmationDialogProps) => {
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
              <Dialog.Panel className="relative w-full max-w-md space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <div className="flex flex-col px-4 text-center">
                  <Warning strokeWidth={2} className="mx-auto h-16 w-16" />
                  <p className="text-center font-semibold text-pink-dark dark:text-pink-neon">
                    {message ?? (
                      <>
                        Please note that this action is not reversible. Continue
                        with caution.
                      </>
                    )}
                  </p>
                  <div className="mt-5 flex justify-between">
                    <Button
                      intent="outline"
                      aria-label="close dialog"
                      onClick={() => onClose()}
                    >
                      Close
                    </Button>
                    <Button
                      aria-label={confirmText ?? 'continue'}
                      onClick={() => {
                        onConfirm()
                        onClose()
                      }}
                    >
                      {confirmText ?? 'Continue'}
                    </Button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
