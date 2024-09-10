import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { IUserCard } from '@/lib/api/card'

type UserCardPINDialogProos = Pick<DialogProps, 'onClose'> & {
  card: IUserCard
}

// TODO: Create form after we have the exact API endpoint and after we decide
// when to send the changes:
//   - on change (debounced values for the input and checkboxes)
//   - have a submit button
export const UserCardPINDialog = ({
  card,
  onClose
}: UserCardPINDialogProos) => {
  console.log(card)
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
                  Card PIN
                </Dialog.Title>
                Content
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
