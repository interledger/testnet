import type { DialogProps } from '@/lib/types/dialog'
import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useEffect } from 'react'
import { Input } from '@/ui/forms/Input'
import { Button } from '@/ui/Button'
import { useDialog } from '@/lib/hooks/useDialog'
import { ErrorDialog } from './ErrorDialog'
import { getObjectKeys } from '@/utils/helpers'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Form } from '@/ui/forms/Form'
import { useRouter } from 'next/router'
import {
  BaseWalletAddressArgs,
  uploadKeySchema,
  walletAddressService
} from '@/lib/api/walletAddress'
import { TextArea } from '@/ui/forms/TextArea'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { BASE64_PUBLIC_KEY } from '@/utils/constants'

type UploadPublicKeyProps = Pick<DialogProps, 'onClose'> & BaseWalletAddressArgs

export const UploadPublicKeyDialog = ({
  onClose,
  accountId,
  walletAddressId
}: UploadPublicKeyProps) => {
  const router = useRouter()
  const { setRunOnboarding, isDevKeysOnboarding, stepIndex, setStepIndex } =
    useOnboardingContext()
  const [openDialog, closeDialog] = useDialog()
  const uploadKeysForm = useZodForm({
    schema: uploadKeySchema,
    defaultValues: {
      jwk: isDevKeysOnboarding ? BASE64_PUBLIC_KEY : ''
    }
  })

  useEffect(() => {
    if (isDevKeysOnboarding) {
      setStepIndex(stepIndex + 1)
      setRunOnboarding(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
                  className="text-center text-2xl font-medium"
                >
                  Add a public key
                </Dialog.Title>
                <div className="px-4">
                  <Form
                    form={uploadKeysForm}
                    onSubmit={async (data) => {
                      const response = await walletAddressService.uploadKey({
                        nickname: data.nickname,
                        jwk: data.jwk,
                        accountId: accountId,
                        walletAddressId: walletAddressId
                      })

                      if (!response) {
                        openDialog(
                          <ErrorDialog
                            onClose={closeDialog}
                            content="Upload Keys failed. Please try again."
                          />
                        )
                        return
                      }

                      if (response.success) {
                        router.replace(router.asPath)
                        closeDialog()

                        if (isDevKeysOnboarding) {
                          setStepIndex(stepIndex + 1)
                          setRunOnboarding(true)
                        }
                      } else {
                        const { errors, message } = response
                        if (errors) {
                          getObjectKeys(errors).map((field) =>
                            uploadKeysForm.setError(field, {
                              message: errors[field]
                            })
                          )
                        }
                        if (message) {
                          uploadKeysForm.setError('root', { message })
                        }
                      }
                    }}
                  >
                    <Input
                      required
                      label="Nickname"
                      id="nicknameUpload"
                      error={
                        uploadKeysForm.formState?.errors?.nickname?.message
                      }
                      {...uploadKeysForm.register('nickname')}
                      onKeyDown={() => {
                        if (isDevKeysOnboarding) {
                          setRunOnboarding(false)
                        }
                      }}
                    />
                    <TextArea
                      required
                      label="Public key"
                      placeholder={BASE64_PUBLIC_KEY}
                      error={uploadKeysForm.formState?.errors?.jwk?.message}
                      {...uploadKeysForm.register('jwk')}
                    />
                    <div className="mt-5 flex justify-between">
                      <Button
                        intent="outline"
                        aria-label="close dialog"
                        onClick={() => {
                          onClose()
                          if (isDevKeysOnboarding) {
                            setStepIndex(stepIndex + 1)
                            setRunOnboarding(true)
                          }
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        aria-label="upload"
                        type="submit"
                        loading={uploadKeysForm.formState.isSubmitting}
                      >
                        Upload key
                      </Button>
                    </div>
                  </Form>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
