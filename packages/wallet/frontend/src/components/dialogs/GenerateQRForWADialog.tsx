import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment, useRef, useState } from 'react'
import type { DialogProps } from '@/lib/types/dialog'
import { IWalletAddressResponse } from '@wallet/shared'
import { Button } from '@/ui/Button'
import { Input } from '@/ui/forms/Input'
import { useQRCode } from 'next-qrcode'
import jsPDF from 'jspdf'

const loadImageAsCanvas = (src: string): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      canvas.getContext('2d')?.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = () => reject(new Error(`Could not load image: ${src}`))
    img.src = src
  })
}

type GenerateQRForWADialogProps = Pick<DialogProps, 'onClose'> & {
  walletAddress: IWalletAddressResponse
}

export const GenerateQRForWADialog = ({
  onClose,
  walletAddress
}: GenerateQRForWADialogProps) => {
  const [description, setDescription] = useState('')
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const { Image } = useQRCode()
  const walletAddressUrl = walletAddress.url.replace('$', 'https://')
  const qrUrl = new URL('/send', window.location.origin)
  qrUrl.searchParams.set('merchantWA', walletAddressUrl)
  if (description) {
    qrUrl.searchParams.set('merchantDescription', description)
  }
  const qrPayload = qrUrl.toString()

  const handleDownload = async () => {
    const qrImg = qrContainerRef.current?.querySelector('img')
    if (!qrImg?.src) return

    const doc = new jsPDF({ unit: 'mm', format: 'a4' })
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()

    doc.setFillColor(235, 233, 230)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    const bottomLogoCanvas = await loadImageAsCanvas(
      '/interledger-big-half-logo.png'
    )
    const bottomLogoHeight =
      pageWidth * (bottomLogoCanvas.height / bottomLogoCanvas.width)
    doc.addImage(
      bottomLogoCanvas,
      'PNG',
      0,
      pageHeight - bottomLogoHeight,
      pageWidth,
      bottomLogoHeight
    )

    const qrSize = 90
    const contentLeft = (pageWidth - qrSize) / 2

    const pxToMm = 25.4 / 96
    const qrBorderThickness = 60 * pxToMm
    const qrBottomOffset = 130 * pxToMm
    const qrY = pageHeight - qrBottomOffset - qrSize - qrBorderThickness

    const topLogoCanvas = await loadImageAsCanvas('/interledger-technology.png')
    const topLogoWidth = qrSize + qrBorderThickness * 2
    const topLogoHeight =
      topLogoWidth * (topLogoCanvas.height / topLogoCanvas.width)
    const topLogoY = 20
    doc.addImage(
      topLogoCanvas,
      'PNG',
      contentLeft - qrBorderThickness,
      topLogoY,
      topLogoWidth,
      topLogoHeight
    )

    const scanToPayCanvas = await loadImageAsCanvas('/scan-to-pay.png')
    const scanToPayWidth = qrSize + qrBorderThickness * 2
    const scanToPayHeight =
      scanToPayWidth * (scanToPayCanvas.height / scanToPayCanvas.width)
    const scanToPayY = qrY - qrBorderThickness - 20 - scanToPayHeight
    doc.addImage(
      scanToPayCanvas,
      'PNG',
      contentLeft - qrBorderThickness,
      scanToPayY,
      scanToPayWidth,
      scanToPayHeight
    )

    doc.setFillColor(255, 255, 255)
    doc.roundedRect(
      contentLeft - qrBorderThickness,
      qrY - qrBorderThickness,
      qrSize + qrBorderThickness * 2,
      qrSize + qrBorderThickness * 2,
      8,
      8,
      'F'
    )

    doc.addImage(qrImg.src, 'JPEG', contentLeft, qrY, qrSize, qrSize)

    doc.save(`Interledger-qr-code.pdf`)
  }

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
                  Generate QR code for a Wallet Address as a merchant
                </DialogTitle>

                <div className="flex justify-between items-center flex-col">
                  <div>{walletAddressUrl}</div>
                  <div className="w-full py-2">
                    <Input
                      label="Description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                    />
                  </div>
                  <div className="py-4" ref={qrContainerRef}>
                    <Image
                      text={qrPayload}
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
                  <div className="flex justify-evenly w-full">
                    <Button
                      intent="outline"
                      aria-label="download QR code"
                      onClick={handleDownload}
                    >
                      Download
                    </Button>
                    <Button
                      intent="outline"
                      aria-label="close dialog"
                      onClick={() => onClose()}
                    >
                      Done
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
