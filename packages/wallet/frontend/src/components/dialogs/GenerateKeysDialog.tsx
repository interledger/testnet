import type { DialogProps } from '@/lib/types/dialog'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild
} from '@headlessui/react'
import { Fragment, useEffect } from 'react'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from './ErrorDialog'
import { generateAndDownloadFile } from '@/utils/helpers'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { useRouter } from 'next/router'
import {
  BaseWalletAddressArgs,
  generateKeysSchema,
  walletAddressService
} from '@/lib/api/walletAddress'
import { SuccessDialog } from './SuccessDialog'
import { CopyButton } from '@/ui/CopyButton'
import { useOnboardingContext } from '@/lib/context/onboarding'

type GenerateKeysProps = Pick<DialogProps, 'onClose'> & BaseWalletAddressArgs

export const GenerateKeysDialog = ({
  onClose,
  accountId,
  walletAddressId
}: GenerateKeysProps) => {
  const router = useRouter()
  const [openDialog, closeDialog] = useDialog()
  const generateKeysForm = useZodForm({
    schema: generateKeysSchema
  })
  const { setRunOnboarding, isDevKeysOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()

  useEffect(() => {
    if (isDevKeysOnboarding) {
      setStepIndex(stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generatePublicAndPrivateKeys(data: { nickname: string }) {
    const response = await walletAddressService.generateKey({
      accountId: accountId,
      walletAddressId: walletAddressId,
      nickname: data.nickname
    })

    if (!response.success) {
      openDialog(
        <ErrorDialog onClose={() => closeDialog()} content={response.message} />
      )
      return
    }

    if (response.result) {
      const { privateKey } = response.result

      generateAndDownloadFile({
        content: privateKey,
        fileName: 'private.key',
        fileType: 'TEXT_PLAIN'
      })

      openDialog(
        <SuccessDialog
          title="Success"
          size="lg"
          content={
            <div className="text-base">
              <p>Your payment pointer keys were successfully generated.</p>
              <div className="mt-4 space-y-2" id="copyKey">
                <p className="text-base">
                  The private key has been automatically downloaded to your
                  machine.
                </p>
                <pre className="whitespace-pre-wrap rounded-md bg-green-light p-2 text-left text-sm dark:bg-purple-dark">
                  <code className="break-all">{privateKey}</code>
                </pre>
                <div className="space-y-2">
                  <CopyButton
                    ctaText="Copy private key"
                    aria-label="copy private key"
                    value={privateKey}
                    fullWidth
                  />
                  <CopyButton
                    ctaText="Copy base64 encoded private key"
                    aria-label="copy base64 encoded private key"
                    value={btoa(privateKey.trim())}
                    fullWidth
                  />
                </div>
              </div>
            </div>
          }
          onClose={() => {
            if (isDevKeysOnboarding) {
              setRunOnboarding(false)
            }
            closeDialog()
            router.replace(router.asPath)
          }}
        />
      )
      if (isDevKeysOnboarding) {
        setStepIndex(stepIndex + 1)
        setRunOnboarding(true)
      }
    }
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
              <DialogPanel className="relative w-full max-w-lg space-y-4 overflow-hidden rounded-lg bg-white p-8 shadow-xl dark:bg-purple">
                <DialogTitle
                  as="h3"
                  className="text-center text-2xl font-medium"
                >
                  Generate public & private key
                </DialogTitle>
                <div className="px-4">
                  <Form
                    form={generateKeysForm}
                    onSubmit={async (data) => {
                      generatePublicAndPrivateKeys(data)
                    }}
                  >
                    <Input
                      required
                      label="Nickname"
                      id="nickname"
                      error={
                        generateKeysForm.formState?.errors?.nickname?.message
                      }
                      {...generateKeysForm.register('nickname')}
                      onKeyDown={() => {
                        if (isDevKeysOnboarding) {
                          setRunOnboarding(false)
                        }
                      }}
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
                        aria-label="upload"
                        type="submit"
                        loading={generateKeysForm.formState.isSubmitting}
                      >
                        Generate keys
                      </Button>
                    </div>
                  </Form>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
