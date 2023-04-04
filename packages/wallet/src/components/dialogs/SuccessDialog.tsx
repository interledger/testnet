import { Button } from '@/ui/Button'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { BirdSuccess } from '../icons/Bird'
import type { DialogProps } from '@/lib/types/dialog'
import { CopyButton } from '@/ui/CopyButton'

type SuccessDialogProps = DialogProps & {
  onSuccess?: () => void
  redirect?: string
  redirectText?: string
  copyToClipboard?: string
}

export const SuccessDialog = ({
  onClose,
  onSuccess,
  title,
  content,
  redirect,
  redirectText,
  copyToClipboard
}: SuccessDialogProps) => {
  const successButtonProps: {
    href?: string
    onClick?: () => void
  } = {
    href: redirect ?? '/',
    onClick: () => {
      onSuccess ? onSuccess() : undefined
      onClose()
    }
  }
  if (onSuccess) {
    delete successButtonProps.href
  }

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
              <Dialog.Panel className="relative w-full max-w-xs overflow-hidden rounded-lg bg-gradient-success p-8 shadow-md">
                <div>
                  <BirdSuccess className="mx-auto h-20 w-20" />
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
                  {copyToClipboard && (
                    <div>
                      <p className="mt-2 text-sm font-light text-white">
                        Incoming payment url (copy to clipboard):
                      </p>
                      <p className="mt-2 text-sm font-light text-white">
                        {copyToClipboard}
                      </p>
                      <CopyButton
                        value={copyToClipboard}
                        aria-label="copy api key"
                      />
                    </div>
                  )}
                  <Button
                    intent="secondary"
                    aria-label={redirectText ?? 'redirect'}
                    fullWidth
                    {...successButtonProps}
                  >
                    {redirectText}
                  </Button>
                  {!onSuccess && (
                    <Button
                      intent="success"
                      aria-label="close dialog"
                      fullWidth
                      onClick={() => onClose()}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
