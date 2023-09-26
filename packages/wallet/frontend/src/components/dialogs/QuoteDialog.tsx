import { Quote } from '@/lib/api/transfers'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { Button } from '@/ui/Button'
import { formatAmount, getFee } from '@/utils/helpers'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { PaperPlane } from '../icons/PaperPlane'

type QuoteDialogProps = {
  onClose: () => void
  onAccept: () => void
  quote: Quote
}

export const QuoteDialog = ({ onClose, onAccept, quote }: QuoteDialogProps) => {
  const { setRunOnboarding, stepIndex, setStepIndex } = useOnboardingContext()
  const receiveAmount = formatAmount({
    value: quote.receiveAmount.value,
    assetCode: quote.receiveAmount.assetCode,
    assetScale: quote.receiveAmount.assetScale
  })

  const debitAmount = formatAmount({
    value: quote.debitAmount.value,
    assetCode: quote.debitAmount.assetCode,
    assetScale: quote.debitAmount.assetScale
  })

  const fee = getFee(quote)

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
          <div className="fixed inset-0 bg-gradient-backdrop transition-opacity" />
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
              <Dialog.Panel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg bg-white px-4 py-8 shadow-xl">
                <div className="flex flex-col items-center justify-center px-4">
                  <PaperPlane strokeWidth={2} className="h-16 w-16" />
                  <p className="text-center font-semibold text-turqoise">
                    You send exactly: {debitAmount.amount}
                    <br />
                    Recepient gets: {receiveAmount.amount}
                    <br />
                    Fee: {fee.amount}
                  </p>
                  <div className="mt-5 flex w-full flex-col justify-between space-y-3 sm:flex-row-reverse sm:space-y-0">
                    <Button
                      id="acceptQuote"
                      aria-label="accept quote"
                      onClick={() => {
                        onAccept()
                        onClose()
                        setRunOnboarding(false)
                        setStepIndex(stepIndex + 1)
                      }}
                    >
                      Send
                    </Button>
                    <Button
                      intent="secondary"
                      aria-label="decline"
                      onClick={() => onClose()}
                    >
                      Decline
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
