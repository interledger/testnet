import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { IWalletAddressResponse } from '@wallet/shared'
import { Button } from '@/ui/Button'
import { useQRCode } from 'next-qrcode'

type RegisterPOSDialogProps = Pick<DialogProps, 'onClose'> & {
  walletAddress: IWalletAddressResponse
}

export const RegisterPOSDialog = ({
  onClose,
  walletAddress
}: RegisterPOSDialogProps) => {
  const { Image } = useQRCode()
  const walletAddressUrl = walletAddress.url.replace('$', 'https://')

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
              <DialogPanel className="relative w-full max-w-xl space-y-4 overflow-hidden rounded-lg bg-white dark:bg-purple p-4 shadow-xl">
                <DialogTitle
                  as="h3"
                  className="text-center text-2xl font-medium"
                >
                  Register Wallet Address for a POS
                  <div className="text-sm">(Payment Pointer)</div>
                </DialogTitle>

                <div className="flex justify-between items-center flex-col">
                  <div>{walletAddressUrl}</div>
                  <div className="pb-2">
                    <Image
                      text={walletAddressUrl}
                      options={{
                        type: 'image/jpeg',
                        quality: 1,
                        errorCorrectionLevel: 'M',
                        margin: 3,
                        scale: 4,
                        width: 200,
                        color: {
                          dark: '#000',
                          light: '#FFFFFF'
                        }
                      }}
                    />
                  </div>
                  <Button
                    intent="outline"
                    aria-label="close dialog"
                    onClick={() => onClose()}
                  >
                    Done
                  </Button>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
