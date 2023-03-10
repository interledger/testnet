import { userService, verifyIdentitySchema } from '@/lib/api/user'
import { useDialog } from '@/lib/hooks/useDialog'
import { useZodForm } from '@/lib/hooks/useZodForm'
import { Button } from '@/ui/Button'
import { FieldError } from '@/ui/forms/FieldError'
import { FileUpload } from '@/ui/forms/FileUpload'
import { Form } from '@/ui/forms/Form'
import { USE_TEST_DATA_KYC } from '@/utils/constants'
import { getObjectKeys } from '@/utils/helpers'
import { testImageType, testImageVerifyIdentity } from '@/utils/mocks'
import { useRouter } from 'next/router'
import { SyntheticEvent, useState } from 'react'
import { SuccessDialog } from '../dialogs/SuccessDialog'
import { useKYCFormContext } from './context'

export const VerifyIdentityForm = () => {
  const [openDialog, closeDialog] = useDialog()
  const { idTypes } = useKYCFormContext()
  const [frontIDFile, setFrontIDFile] = useState('')
  const [selfieFile, setSelfieFile] = useState('')
  const [backIDFile, setBackIDFile] = useState('')
  const [isBackRequired, setIsBackRequired] = useState(false)
  const router = useRouter()

  const handleFileOnChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    const fileName = target.value.slice(target.value.lastIndexOf('\\') + 1)
    if (target.name === 'faceImage') {
      setSelfieFile(fileName)
    } else if (target.name === 'frontSideImage') {
      setFrontIDFile(fileName)
    } else {
      setBackIDFile(fileName)
    }
  }

  const handleIdTypeChange = (event: SyntheticEvent<HTMLInputElement>) => {
    const target = event.currentTarget
    setIsBackRequired(target.getAttribute('data-back-id') === 'true')
  }

  const verifyIdentityForm = useZodForm({
    schema: verifyIdentitySchema
  })

  return (
    <Form
      form={verifyIdentityForm}
      onSubmit={async (data) => {
        const response = await userService.verifyIdentity(data)

        if (response.success) {
          openDialog(
            <SuccessDialog
              onClose={() => {
                closeDialog()
                router.push('/')
              }}
              content="Your identity has been veryfied."
              redirect="/"
              redirectText="Go to your account overview"
            />
          )
        } else {
          const { errors, message } = response
          verifyIdentityForm.setError('root', { message })

          if (errors) {
            getObjectKeys(errors).map((field) =>
              verifyIdentityForm.setError(field, { message: errors[field] })
            )
          }
        }
      }}
    >
      {USE_TEST_DATA_KYC && (
        <span className="font-semibold text-pink">
          For testing purposes Passport is selected, and images uploaded by
          default!
        </span>
      )}
      <div>
        <div className="grid grid-cols-3 gap-3">
          {idTypes.map((idType) => (
            <div
              key={idType.type}
              className="flex w-auto items-center justify-center"
            >
              <input
                type="radio"
                id={idType.type}
                className="peer hidden"
                value={idType.type}
                data-back-id={idType.isBackRequired}
                {...verifyIdentityForm.register('documentType', {
                  onChange: handleIdTypeChange
                })}
                // TESTING => Use Passport as default value
                checked={USE_TEST_DATA_KYC && idType.type === 'PA'}
                disabled={USE_TEST_DATA_KYC && idType.type !== 'PA'}
              />
              <label
                htmlFor={idType.type}
                className="w-[150px] cursor-pointer rounded-xl border border-turqoise bg-white p-2 text-center text-base font-light text-turqoise shadow-md peer-checked:border-orange peer-checked:text-orange sm:min-w-[100px]"
              >
                {idType.name}
              </label>
            </div>
          ))}
        </div>
        <FieldError
          error={verifyIdentityForm.formState.errors.documentType?.message}
        />
      </div>
      <div className="flex justify-evenly">
        <div className="my-5">
          {USE_TEST_DATA_KYC ? (
            <>
              <FileUpload disabled={true} label="Selfie image" />
              <input
                type="hidden"
                {...verifyIdentityForm.register('faceImage')}
                value={testImageVerifyIdentity}
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('faceImageType')}
                value={testImageType}
              />
            </>
          ) : (
            <>
              <FileUpload
                label="Selfie image"
                {...verifyIdentityForm.register('faceImage', {
                  onChange: handleFileOnChange
                })}
                error={verifyIdentityForm.formState.errors.faceImage?.message}
              />
              <span className="text-sm font-light text-orange">
                {selfieFile}
              </span>
            </>
          )}
        </div>
        <div className="my-5">
          {!USE_TEST_DATA_KYC ? (
            <>
              <FileUpload
                label="Front side ID"
                {...verifyIdentityForm.register('frontSideImage', {
                  onChange: handleFileOnChange
                })}
                error={
                  verifyIdentityForm.formState.errors.frontSideImage?.message
                }
              />
              <span className="text-sm font-light text-orange">
                {frontIDFile}
              </span>
            </>
          ) : (
            <>
              <FileUpload disabled={true} label="Front side ID" />
              <input
                type="hidden"
                {...verifyIdentityForm.register('frontSideImage')}
                value={testImageVerifyIdentity}
              />
              <input
                type="hidden"
                {...verifyIdentityForm.register('frontSideImageType')}
                value={testImageType}
              />
            </>
          )}
        </div>
        {!USE_TEST_DATA_KYC && isBackRequired && (
          <div className="my-5">
            <FileUpload
              label="Back side ID"
              {...verifyIdentityForm.register('backSideImage', {
                onChange: handleFileOnChange
              })}
              error={verifyIdentityForm.formState.errors.backSideImage?.message}
            />
            <span className="text-sm font-light text-orange">{backIDFile}</span>
          </div>
        )}
      </div>
      <Button aria-label="Verify Account" type="submit">
        Verify Account
      </Button>
    </Form>
  )
}
