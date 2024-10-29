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
import { CopyButton } from '@/ui/CopyButton'
import { cx } from 'class-variance-authority'
import { BirdSuccessDark, BirdSuccessLight } from '../icons/Bird'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { THEME } from '@/utils/constants'

type SuccessDialogProps = DialogProps & {
  onSuccess?: () => void
  redirect?: string
  redirectText?: string
  copyToClipboard?: string
  size?: 'xs' | 'lg'
}

export const SuccessDialog = ({
  onClose,
  onSuccess,
  title,
  content,
  redirect,
  redirectText,
  copyToClipboard,
  size = 'xs'
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

  const { isUserFirstTime, setRunOnboarding } = useOnboardingContext()

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
              <DialogPanel
                className={cx(
                  'relative w-full space-y-4 overflow-hidden rounded-lg bg-white dark:bg-purple p-8 shadow-xl',
                  size === 'xs' && 'max-w-xs',
                  size === 'lg' && 'max-w-lg'
                )}
              >
                <div>
                  {THEME === 'dark' ? (
                    <BirdSuccessDark className="mx-auto h-20 w-20" />
                  ) : (
                    <BirdSuccessLight className="mx-auto h-20 w-20" />
                  )}
                  <div className="mt-3 text-center">
                    <DialogTitle
                      as="h3"
                      className="text-2xl text-center font-bold"
                    >
                      {title}
                    </DialogTitle>

                    <div className="mt-2 text-sm font-light">{content}</div>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-1 gap-3">
                  {copyToClipboard && (
                    <CopyButton
                      ctaText="Copy incoming payment URL"
                      value={copyToClipboard}
                      aria-label="copy api key"
                      id="copyIncomingPaymentUrl"
                    />
                  )}
                  {(onSuccess || redirect) && (
                    <Button
                      id="redirectButtonSuccess"
                      intent="primary"
                      aria-label={redirectText ?? 'redirect'}
                      fullWidth
                      onFocus={() => {
                        if (isUserFirstTime) {
                          setRunOnboarding(true)
                        }
                      }}
                      {...successButtonProps}
                    >
                      {redirectText}
                    </Button>
                  )}
                  {!onSuccess && (
                    <Button
                      intent="outline"
                      aria-label="close dialog"
                      fullWidth
                      id="closeButtonSuccess"
                      onClick={() => onClose()}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
