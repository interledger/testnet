import { useOnboardingContext } from '@/lib/context/onboarding'
import { Button } from '@/ui/Button'
import { formatAmount, getFee } from '@/utils/helpers'
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import { PaperPlaneDark, PaperPlaneLight } from '../icons/PaperPlane'
import { QuoteResponse } from '@wallet/shared'
import { THEME } from '@/utils/constants'

type QuoteDialogProps = {
  onClose: () => void
  onAccept: () => void
  quote: QuoteResponse
  type: string
  receiverName?: string
}

export const QuoteDialog = ({
  onClose,
  onAccept,
  quote,
  type,
  receiverName
}: QuoteDialogProps) => {
  const { setRunOnboarding, stepIndex, setStepIndex, isUserFirstTime } =
    useOnboardingContext()
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
          <div className="fixed inset-0 bg-green-modal/75 transition-opacity dark:bg-black/75" />
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
              <DialogPanel className="relative w-full max-w-sm space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <div className="flex flex-col text-center">
                  {THEME === 'dark' ? (
                    <PaperPlaneDark
                      strokeWidth={2}
                      className="mx-auto h-16 w-16"
                    />
                  ) : (
                    <PaperPlaneLight
                      strokeWidth={2}
                      className="mx-auto h-16 w-16"
                    />
                  )}
                  <p className="text-center font-semibold text-green-modal dark:text-green-neon">
                    {type === 'quote' ? 'You send: ' : 'You exchange: '}
                    {debitAmount.amount}
                    <br />
                    {type === 'quote'
                      ? receiverName
                        ? `${receiverName} gets: `
                        : 'Recepient gets: '
                      : 'You get: '}
                    {receiveAmount.amount}
                    <br />
                    {type === 'quote' ? 'Fee: ' : 'Exchange fee: '} {fee.amount}
                  </p>
                  <div className="mt-5 flex justify-between">
                    <Button
                      intent="outline"
                      aria-label="decline"
                      onClick={() => onClose()}
                    >
                      Decline
                    </Button>
                    <Button
                      id="acceptQuote"
                      aria-label="accept quote"
                      onClick={() => {
                        onAccept()
                        onClose()
                        if (isUserFirstTime) {
                          setRunOnboarding(false)
                          setStepIndex(stepIndex + 1)
                        }
                      }}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
