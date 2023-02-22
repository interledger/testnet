import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { BirdError } from '../icons/Bird'
import type { DialogProps } from '@/lib/types/dialog'

type ErrorDialogProps = DialogProps

export const ErrorDialog = ({ onClose, title, content }: ErrorDialogProps) => {
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
          <div className="fixed inset-0 bg-white/80 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4"
              enterTo="opacity-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-4"
            >
              <Dialog.Panel className="bg-gradient-error relative w-full max-w-xs overflow-hidden rounded-lg p-8 shadow-md">
                <div>
                  <BirdError className="mx-auto h-20 w-20" />
                  <div className="mt-3 text-center">
                    <Dialog.Title
                      as="h3"
                      className="text-3xl font-medium text-white"
                    >
                      {title}
                    </Dialog.Title>

                    <p className="mt-2 text-sm font-light text-white">
                      {content}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  <Button
                    intent="error"
                    aria-label="close dialog"
                    fullWidth
                    onClick={() => onClose()}
                  >
                    Close
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
